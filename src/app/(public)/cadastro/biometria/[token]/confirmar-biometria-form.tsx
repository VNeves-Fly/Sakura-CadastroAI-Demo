"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { confirmarBiometriaAction, consultarStatusBiometriaAction } from "./actions";
import { maskCpf, validarCpfComMensagem } from "@/modules/cadastro/utils/cpf.util";
import type { ObterStatusBiometriaResult } from "@/modules/cadastro/application/use-cases/obter-status-biometria.use-case";

type Status =
  | { kind: "idle" }
  | { kind: "verificando" }
  | { kind: "erro"; mensagem: string }
  | ({ kind: "confirmado" } & ObterStatusBiometriaResult);

// O redirect_url mandado pra Legitimuz é esta mesma página — quando ela
// termina o widget, o navegador SAI do nosso domínio e volta como uma
// navegação de página cheia (não uma transição client-side), então todo
// estado em memória (inclusive o CPF que o sócio já tinha confirmado
// segundos antes) se perde e ele cairia de novo no formulário de CPF do
// zero (relatado pelo usuário, 2026-08-26). sessionStorage sobrevive a
// esse reload (mesma aba) sem precisar mexer em nada do lado da
// Legitimuz — o CPF só é salvo depois de já ter sido validado contra o
// registro (ver aplicarResultado), então isso não abre nenhum atalho de
// segurança novo em relação ao formulário manual.
function chaveCpfSalvo(tok: string): string {
  return `biometria-cpf-${tok}`;
}

// Enquanto pendente/análise manual (ou aprovado mas o link de assinatura
// ainda não saiu — ver `precisaContinuarPollando` abaixo), repolla sozinho
// com o mesmo CPF já confirmado — o resultado real (aprovado/reprovado)
// só chega depois via webhook da Legitimuz, então sem isso o sócio
// precisaria ficar recarregando a página manualmente até o resultado sair.
const INTERVALO_POLL_MS = 15_000;

// Sócio que já tinha aprovado a biometria (abriu o link de novo, ou é o
// resultado de um poll) não precisa clicar em nada — encaminha direto pro
// D4Sign depois de um respiro curto pra dar tempo de ler "aprovada!".
const REDIRECT_ASSINATURA_MS = 5_000;

export function ConfirmarBiometriaForm({ token }: { token: string }) {
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const cpfConfirmadoRef = useRef<string | null>(null);

  function aplicarResultado(cpfConfirmado: string, resultado: ObterStatusBiometriaResult) {
    cpfConfirmadoRef.current = cpfConfirmado;
    try {
      sessionStorage.setItem(chaveCpfSalvo(token), cpfConfirmado);
    } catch {
      // sessionStorage indisponível (aba anônima/modo privado etc.) — só
      // perde a retomada automática depois do redirect da Legitimuz, o
      // fluxo manual (digitar o CPF de novo) continua funcionando.
    }
    setStatus({ kind: "confirmado", ...resultado });
  }

  function confirmarInicial(cpfDigitado: string) {
    startTransition(async () => {
      try {
        const resultado = await confirmarBiometriaAction(token, cpfDigitado);
        aplicarResultado(cpfDigitado, resultado);
      } catch (error) {
        setStatus({
          kind: "erro",
          mensagem:
            error instanceof Error ? error.message : "Não foi possível confirmar. Tente novamente.",
        });
      }
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validacao = validarCpfComMensagem(cpf);
    if (!validacao.valido) {
      setStatus({ kind: "erro", mensagem: validacao.mensagem ?? "CPF inválido." });
      return;
    }
    confirmarInicial(cpf);
  }

  // Retomada automática após o redirect da Legitimuz — reusa o CPF salvo
  // em sessionStorage (ver chaveCpfSalvo) nesta mesma aba, sem obrigar o
  // sócio a digitar de novo. Usa consultarStatusBiometriaAction (rate
  // limit folgado — ver actions.ts) por ser uma reconsulta, não uma nova
  // tentativa de confirmação; se o CPF salvo não bater mais por algum
  // motivo, só cai de volta pro formulário em vez de mostrar erro.
  useEffect(() => {
    let cpfSalvo: string | null = null;
    try {
      cpfSalvo = sessionStorage.getItem(chaveCpfSalvo(token));
    } catch {
      cpfSalvo = null;
    }
    if (!cpfSalvo) return;

    setStatus({ kind: "verificando" });
    (async () => {
      try {
        const resultado = await consultarStatusBiometriaAction(token, cpfSalvo);
        aplicarResultado(cpfSalvo, resultado);
      } catch {
        setStatus({ kind: "idle" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem, token é estável
  }, [token]);

  // Poll automático — continua enquanto ainda não há desfecho pro sócio
  // ver: pendente/análise manual (esperando a Legitimuz) OU já aprovado
  // mas sem link de assinatura ainda (esperando o D4Sign capturar o
  // keySigner — ver comentário em ObterStatusBiometriaUseCase). Usa
  // consultarStatusBiometriaAction (rate limit próprio, bem mais folgado
  // que o de confirmação — ver actions.ts) e, numa falha transitória, só
  // ignora e tenta de novo no próximo tick em vez de derrubar o status já
  // confirmado (senão a tela voltaria a pedir CPF no meio da espera).
  useEffect(() => {
    if (status.kind !== "confirmado") return;
    const precisaContinuarPollando =
      status.status === "pendente" ||
      status.status === "analise_manual" ||
      (status.status === "aprovado" && !status.linkAssinatura);
    if (!precisaContinuarPollando) return;
    const cpfAtual = cpfConfirmadoRef.current;
    if (!cpfAtual) return;

    const intervalo = setInterval(async () => {
      try {
        const resultado = await consultarStatusBiometriaAction(token, cpfAtual);
        setStatus({ kind: "confirmado", ...resultado });
      } catch {
        // Falha transitória (rate limit, blip de rede) — mantém o status
        // atual na tela, tenta de novo no próximo tick.
      }
    }, INTERVALO_POLL_MS);
    return () => clearInterval(intervalo);
  }, [status, token]);

  // Redireciona sozinho pro D4Sign assim que o link de assinatura sai —
  // cobre tanto quem chegou aqui e já tinha aprovado (poll trouxe o link
  // na primeira consulta) quanto quem está vendo a aprovação acontecer ao
  // vivo. O botão abaixo continua disponível pra quem não quiser esperar.
  useEffect(() => {
    if (status.kind !== "confirmado" || status.status !== "aprovado" || !status.linkAssinatura) {
      return;
    }
    const link = status.linkAssinatura;
    const timeout = setTimeout(() => {
      window.location.href = link;
    }, REDIRECT_ASSINATURA_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  if (status.kind === "confirmado" && status.status === "aprovado") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <p className="text-success text-sm font-medium">✓ Biometria aprovada!</p>
        {status.linkAssinatura ? (
          <>
            <p className="text-muted-foreground text-sm">
              Encaminhando você pra assinatura do contrato...
            </p>
            <a
              href={status.linkAssinatura}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-6 py-2.5 text-sm font-semibold transition"
            >
              Assinar contrato agora
            </a>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            Estamos preparando seu link de assinatura — esta página atualiza sozinha assim que ficar
            pronto.
          </p>
        )}
      </div>
    );
  }

  if (status.kind === "confirmado" && status.status === "reprovado") {
    return (
      <div className="mt-6 text-center">
        <p className="text-destructive text-sm font-medium">Verificação de biometria reprovada.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Entre em contato com o analista responsável pelo seu cadastro.
        </p>
      </div>
    );
  }

  if (
    status.kind === "confirmado" &&
    (status.status === "pendente" || status.status === "analise_manual")
  ) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        {status.status === "analise_manual" ? (
          <p className="text-warning text-sm">
            Sua verificação está em análise manual. Isso pode levar um pouco mais de tempo.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Falta pouco! Complete a verificação de biometria facial pelo link abaixo.
          </p>
        )}
        {status.legitimuzUrl ? (
          <a
            href={status.legitimuzUrl}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 w-fit rounded-full px-6 py-2.5 text-sm font-semibold transition"
          >
            Iniciar verificação
          </a>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Esta página atualiza sozinha assim que o resultado sair.
        </p>
      </div>
    );
  }

  if (status.kind === "verificando") {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <p className="text-muted-foreground text-sm">Verificando sua biometria...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-3">
      <label htmlFor="cpf-biometria" className="text-muted-foreground text-center text-sm">
        Digite seu CPF pra continuar
      </label>
      <input
        id="cpf-biometria"
        inputMode="numeric"
        autoComplete="off"
        required
        maxLength={14}
        disabled={isPending}
        value={cpf}
        onChange={(event) => {
          setCpf(maskCpf(event.target.value));
          if (status.kind === "erro") setStatus({ kind: "idle" });
        }}
        placeholder="000.000.000-00"
        className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-xl border px-4 py-3 text-center text-lg tracking-wide outline-none focus-visible:ring-2 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
      >
        {isPending ? "Confirmando..." : "Confirmar"}
      </button>
      {status.kind === "erro" ? (
        <p role="status" aria-live="polite" className="text-destructive text-center text-sm">
          {status.mensagem}
        </p>
      ) : null}
    </form>
  );
}

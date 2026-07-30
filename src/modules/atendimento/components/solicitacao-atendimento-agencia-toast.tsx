"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { useSolicitacoesAtendimentoAgenciaStore } from "@/modules/atendimento/stores/solicitacoes-atendimento-agencia.store";
import { useToastStore } from "@/modules/shared/stores/toast.store";
import { useSegundosRestantes } from "@/modules/atendimento/hooks/use-segundos-restantes";
import {
  atendimentoAgenciaApi,
  TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS,
} from "@/modules/atendimento/services/atendimento-agencia-api";
import type { SolicitacaoAtendimentoAgencia } from "@/modules/atendimento/types/atendimento-agencia.types";

const TITULO_POR_TIPO: Record<SolicitacaoAtendimentoAgencia["tipo"], string> = {
  transferencia: "Transferência de atendimento",
  assuncao: "Solicitação de transferência",
};

// As 4 combinações tipo×papel — texto e quais botões aparecem. Ver
// papelNaSolicitacao (backend) pra entender por que só essas 4 existem: o
// destinatário da TRANSFERENCIA só confirma (quem transfere decide
// cancelar); na ASSUNCAO, o destinatário (atendente atual) também cancela.
function textoEBotoes(solicitacao: SolicitacaoAtendimentoAgencia): {
  texto: string;
  mostrarConfirmar: boolean;
  mostrarCancelar: boolean;
} {
  switch (`${solicitacao.tipo}:${solicitacao.meuPapel}`) {
    case "transferencia:solicitante":
      return {
        texto: `Aguardando a confirmação de ${solicitacao.novoAtendenteNome}`,
        mostrarConfirmar: false,
        mostrarCancelar: true,
      };
    case "transferencia:destinatario":
      return {
        texto: `${solicitacao.solicitanteNome} solicitou a transferência do cadastro ${solicitacao.agenciaNome}`,
        mostrarConfirmar: true,
        mostrarCancelar: false,
      };
    case "assuncao:solicitante":
      return {
        texto: "Foi solicitado a transferência do atendimento",
        mostrarConfirmar: false,
        mostrarCancelar: true,
      };
    case "assuncao:destinatario":
      return {
        texto: `${solicitacao.solicitanteNome} solicitou a transferência do atendimento de ${solicitacao.agenciaNome}`,
        mostrarConfirmar: true,
        mostrarCancelar: true,
      };
    default:
      return { texto: "", mostrarConfirmar: false, mostrarCancelar: false };
  }
}

function CardSolicitacao({ solicitacao }: { solicitacao: SolicitacaoAtendimentoAgencia }) {
  const segundos = useSegundosRestantes(
    solicitacao.criadaEm,
    TIMEOUT_SOLICITACAO_ATENDIMENTO_AGENCIA_MS,
  );
  const mostrarToast = useToastStore((state) => state.mostrarToast);
  const [enviando, setEnviando] = useState(false);
  const forcouLeituraRef = useRef(false);

  useEffect(() => {
    if (segundos > 0 || forcouLeituraRef.current) return;
    forcouLeituraRef.current = true;
    // Countdown zerou no client — força uma leitura no servidor pra
    // efetivar a expiração (que já é sucesso aqui, ver
    // PrismaSolicitacaoAtendimentoAgenciaRepository) sem esperar o poll de
    // segurança de 60s; o resultado final chega pelos dois lados via SSE.
    atendimentoAgenciaApi.listarPendentes().catch(() => {});
  }, [segundos]);

  const { texto, mostrarConfirmar, mostrarCancelar } = textoEBotoes(solicitacao);

  async function confirmar() {
    setEnviando(true);
    try {
      await atendimentoAgenciaApi.confirmar(solicitacao.id);
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    setEnviando(true);
    try {
      await atendimentoAgenciaApi.cancelar(solicitacao.id);
    } catch (error) {
      mostrarToast((error as Error).message, "erro");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border-border bg-card flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg">
      <p className="text-foreground font-medium">{TITULO_POR_TIPO[solicitacao.tipo]}</p>
      <p className="text-muted-foreground">{texto}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="size-3.5" />
          {segundos}s
        </span>
        <div className="flex items-center gap-2">
          {mostrarConfirmar && (
            <button
              type="button"
              disabled={enviando}
              onClick={confirmar}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60"
            >
              Confirmar
            </button>
          )}
          {mostrarCancelar && (
            <button
              type="button"
              disabled={enviando}
              onClick={cancelar}
              className="border-input hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Canto inferior direito (distinto do ToastViewport genérico, que fica no
// canto superior direito) — pedido persistente precisa de contador + 1 ou
// 2 botões, não desaparece em 5s como o toast comum.
export function SolicitacaoAtendimentoAgenciaToast() {
  const pendentes = useSolicitacoesAtendimentoAgenciaStore((state) => state.pendentes);
  if (pendentes.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[95] flex w-full max-w-sm flex-col gap-2">
      {pendentes.map((solicitacao) => (
        <CardSolicitacao key={solicitacao.id} solicitacao={solicitacao} />
      ))}
    </div>
  );
}

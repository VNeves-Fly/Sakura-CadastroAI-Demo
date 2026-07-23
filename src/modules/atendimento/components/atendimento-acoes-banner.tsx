"use client";

import { useEffect, useState } from "react";
import { UserCog, LogOut, Repeat, Clock } from "lucide-react";
import type { Conversa } from "@/modules/atendimento/types/atendimento.types";
import {
  HORAS_LIMITE_ASSUMIR,
  TIMEOUT_TRANSFERENCIA_MS,
  podeAssumirAtendimento,
} from "@/modules/atendimento/services/atendimento-api";
import { formatarTempoDecorrido } from "@/modules/atendimento/utils/atendimento-formato.util";

interface AnalistaOpcao {
  id: string;
  nome: string;
}

interface AtendimentoAcoesBannerProps {
  conversa: Conversa;
  analistaAtual: string;
  onAssumir: () => void;
  onEncerrar: () => void;
  onSolicitarTransferencia: (paraAnalista: string) => void;
  onResponderTransferencia: (aceita: boolean) => void;
  onLimparSolicitacaoResolvida: () => void;
}

const BOTAO =
  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition";

function SegundosRestantes({ criadaEm }: { criadaEm: string }) {
  const [restante, setRestante] = useState(() =>
    Math.max(0, TIMEOUT_TRANSFERENCIA_MS - (Date.now() - new Date(criadaEm).getTime())),
  );

  useEffect(() => {
    const intervalo = setInterval(() => {
      setRestante(
        Math.max(0, TIMEOUT_TRANSFERENCIA_MS - (Date.now() - new Date(criadaEm).getTime())),
      );
    }, 1000);
    return () => clearInterval(intervalo);
  }, [criadaEm]);

  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs">
      <Clock className="size-3.5" />
      {Math.ceil(restante / 1000)}s
    </span>
  );
}

// Busca analistas reais (User) em vez da lista mock — carrega só quando
// o dropdown abre, já que a lista raramente muda e não vale a pena
// buscar de cara pra toda conversa aberta. `onEscolher` recebe o id do
// analista (não o nome) — é o que a rota de transferência real espera.
function SeletorTransferencia({
  analistaAtual,
  onEscolher,
}: {
  analistaAtual: string;
  onEscolher: (paraAnalistaId: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [opcoes, setOpcoes] = useState<AnalistaOpcao[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    fetch("/api/users")
      .then((response) => response.json())
      .then((usuarios: { id: string; firstName: string; lastName: string }[]) => {
        setOpcoes(
          usuarios
            .map((usuario) => ({
              id: usuario.id,
              nome: `${usuario.firstName} ${usuario.lastName}`.trim(),
            }))
            .filter((opcao) => opcao.nome !== analistaAtual),
        );
      })
      .finally(() => setCarregando(false));
  }, [aberto, analistaAtual]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className={`${BOTAO} border-input text-foreground hover:bg-accent border`}
      >
        <Repeat className="size-3.5" />
        Transferir
      </button>
      {aberto ? (
        <div className="border-border bg-card absolute top-full right-0 z-10 mt-2 flex w-56 flex-col gap-1 rounded-xl border p-2 shadow-xl">
          {carregando ? (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">Carregando...</p>
          ) : opcoes.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-xs">
              Nenhum outro analista disponível.
            </p>
          ) : (
            opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  onEscolher(opcao.id);
                  setAberto(false);
                }}
                className="hover:bg-accent rounded-lg px-2 py-1.5 text-left text-xs font-medium"
              >
                {opcao.nome}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

// A conversa é aberta — todo analista vê tudo — mas só existe 1 "dono"
// por vez (atendimentoAtual). Regras combinadas com o usuário:
// - "Assumir"/"Puxar" (mesma regra, nome muda conforme o contexto): só
//   dá pra tomar de outro analista depois de 2h sem interação.
// - "Encerrar": só quem está atendendo agora encerra — some o dono, sem
//   deixar pendência.
// - "Transferir": pedido explícito (não depende das 2h) — o analista
//   escolhido vê Aceitar/Recusar; sem resposta em 60s conta como recusa.
// Ninguém tem permissão de excluir a conversa — por isso não existe
// nenhum botão de excluir em lugar nenhum deste módulo.
export function AtendimentoAcoesBanner({
  conversa,
  analistaAtual,
  onAssumir,
  onEncerrar,
  onSolicitarTransferencia,
  onResponderTransferencia,
  onLimparSolicitacaoResolvida,
}: AtendimentoAcoesBannerProps) {
  const { atendimentoAtual, solicitacaoTransferenciaPendente: solicitacao } = conversa;

  // Solicitação de transferência dirigida a mim — Aceitar/Recusar têm
  // prioridade sobre qualquer outra ação nesta conversa.
  if (solicitacao?.status === "pendente" && solicitacao.paraAnalista === analistaAtual) {
    return (
      <div className="border-primary/30 bg-primary/5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm">
        <span className="text-foreground">
          <strong>{solicitacao.deAnalista}</strong> quer te transferir este atendimento.
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <SegundosRestantes criadaEm={solicitacao.criadaEm} />
          <button
            type="button"
            onClick={() => onResponderTransferencia(true)}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-3 py-1.5 text-xs font-semibold transition"
          >
            Aceitar
          </button>
          <button
            type="button"
            onClick={() => onResponderTransferencia(false)}
            className="border-input hover:bg-accent rounded-full border px-3 py-1.5 text-xs font-semibold transition"
          >
            Recusar
          </button>
        </div>
      </div>
    );
  }

  // Eu pedi a transferência e ainda está pendente — só espero.
  if (solicitacao?.status === "pendente" && solicitacao.deAnalista === analistaAtual) {
    return (
      <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">
          Aguardando resposta de{" "}
          <strong className="text-foreground">{solicitacao.paraAnalista}</strong>...
        </span>
        <SegundosRestantes criadaEm={solicitacao.criadaEm} />
      </div>
    );
  }

  // Eu pedi e foi recusada (ou expirou sem resposta, mesma coisa pro
  // solicitante) — aviso até o analista dispensar.
  if (
    (solicitacao?.status === "recusada" || solicitacao?.status === "expirada") &&
    solicitacao.deAnalista === analistaAtual
  ) {
    return (
      <div className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm">
        <span className="text-destructive">
          O analista indicado não aceitou a transferência de atendimento.
        </span>
        <button
          type="button"
          onClick={onLimparSolicitacaoResolvida}
          className="border-input hover:bg-accent shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
        >
          Entendi
        </button>
      </div>
    );
  }

  if (!atendimentoAtual) {
    return (
      <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Nenhum analista está atendendo esta conversa.</span>
        <button
          type="button"
          onClick={onAssumir}
          className={`${BOTAO} bg-primary text-primary-foreground hover:bg-sakura-600`}
        >
          <UserCog className="size-3.5" />
          Assumir atendimento
        </button>
      </div>
    );
  }

  const souEu = atendimentoAtual.analistaNome === analistaAtual;
  const podeAssumir = !souEu && podeAssumirAtendimento(atendimentoAtual);

  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm">
      <span className="text-muted-foreground min-w-0">
        Em atendimento por{" "}
        <strong className="text-foreground">
          {souEu ? "você" : atendimentoAtual.analistaNome}
        </strong>{" "}
        (assumiu {formatarTempoDecorrido(atendimentoAtual.assumidoEm)})
      </span>

      {souEu ? (
        <div className="flex shrink-0 items-center gap-2">
          <SeletorTransferencia
            analistaAtual={analistaAtual}
            onEscolher={onSolicitarTransferencia}
          />
          <button
            type="button"
            onClick={onEncerrar}
            className={`${BOTAO} border-destructive/40 text-destructive hover:bg-destructive/10 border`}
          >
            <LogOut className="size-3.5" />
            Encerrar atendimento
          </button>
        </div>
      ) : podeAssumir ? (
        <button
          type="button"
          onClick={onAssumir}
          className={`${BOTAO} bg-primary text-primary-foreground hover:bg-sakura-600`}
        >
          <UserCog className="size-3.5" />
          Puxar atendimento
        </button>
      ) : (
        <span
          className="text-muted-foreground shrink-0 text-xs"
          title={`Só é possível puxar depois de ${HORAS_LIMITE_ASSUMIR}h sem interação`}
        >
          Aguardando {HORAS_LIMITE_ASSUMIR}h de inatividade pra poder puxar
        </span>
      )}
    </div>
  );
}

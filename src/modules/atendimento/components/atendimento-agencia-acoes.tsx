"use client";

import { useEffect, useState } from "react";
import { LogOut, Repeat, UserCog } from "lucide-react";
import { useAtendimentoAgenciaAcoes } from "@/modules/atendimento/hooks/use-atendimento-agencia-acoes";

interface AnalistaOpcao {
  id: string;
  nome: string;
}

interface AtendimentoAgenciaAcoesProps {
  agenciaId: string;
  analistaId: string;
  atendimentoAtual: { analistaId: string; analistaNome: string } | null;
}

const BOTAO =
  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60";

// Mesmo padrão do SeletorTransferencia do banner do chat
// (atendimento-acoes-banner.tsx) — busca analistas reais só quando o
// dropdown abre.
function SeletorAnalista({
  analistaAtualNome,
  disabled,
  onEscolher,
}: {
  analistaAtualNome: string;
  disabled: boolean;
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
            .filter((opcao) => opcao.nome !== analistaAtualNome),
        );
      })
      .finally(() => setCarregando(false));
  }, [aberto, analistaAtualNome]);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className={`${BOTAO} border-input text-foreground hover:bg-accent border`}
      >
        <Repeat className="size-3.5" />
        Transferir atendimento
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

// Ações de Iniciar/Encerrar/Transferir/Assumir do atendimento do CADASTRO
// — único componente pra dossiê (/cadastros/[id]), listagem (/cadastros)
// e chat (/atendimento), sempre chaveado por agenciaId. Mesmo backend em
// qualquer canal (decisão do usuário: "o que temos no WhatsApp e o que
// temos no sistema são uma coisa só").
export function AtendimentoAgenciaAcoes({
  agenciaId,
  analistaId,
  atendimentoAtual: atendimentoAtualProp,
}: AtendimentoAgenciaAcoesProps) {
  const {
    pendente,
    enviando,
    atendimentoAtualOverride,
    iniciar,
    encerrar,
    solicitarTransferencia,
    solicitarAssuncao,
  } = useAtendimentoAgenciaAcoes(agenciaId);

  // Iniciar/Encerrar não têm canal SSE próprio — sobrescreve localmente até
  // o dossiê/listagem revalidar (router.refresh(), já disparado pelo hook)
  // ou o chat reler a lista de conversas.
  const atendimentoAtual =
    atendimentoAtualOverride !== undefined ? atendimentoAtualOverride : atendimentoAtualProp;

  if (pendente) {
    return <span className="text-muted-foreground text-xs">Aguardando resposta…</span>;
  }

  if (!atendimentoAtual) {
    return (
      <button
        type="button"
        disabled={enviando}
        onClick={() => void iniciar()}
        className={`${BOTAO} bg-primary text-primary-foreground hover:bg-sakura-600`}
      >
        <UserCog className="size-3.5" />
        Iniciar atendimento
      </button>
    );
  }

  const souEu = atendimentoAtual.analistaId === analistaId;

  if (souEu) {
    return (
      <div className="flex items-center gap-2">
        <SeletorAnalista
          analistaAtualNome={atendimentoAtual.analistaNome}
          disabled={enviando}
          onEscolher={solicitarTransferencia}
        />
        <button
          type="button"
          disabled={enviando}
          onClick={() => void encerrar()}
          className={`${BOTAO} border-destructive/40 text-destructive hover:bg-destructive/10 border`}
        >
          <LogOut className="size-3.5" />
          Encerrar atendimento
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={enviando}
      onClick={() => void solicitarAssuncao()}
      className={`${BOTAO} bg-primary text-primary-foreground hover:bg-sakura-600`}
    >
      <UserCog className="size-3.5" />
      Assumir atendimento
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAtendimento } from "@/modules/atendimento/view-models/use-atendimento.view-model";
import { ListaConversas } from "@/modules/atendimento/components/lista-conversas";
import { ThreadConversa } from "@/modules/atendimento/components/thread-conversa";
import { PainelInformacoes } from "@/modules/atendimento/components/painel-informacoes";

interface AtendimentoViewProps {
  analistaAtual: string;
  // "?telefone=" (ver AtendimentoButton, no dossiê da agência) — seleciona
  // de cara a conversa daquele contato ao entrar na página, se já existir.
  telefoneInicial?: string;
}

// Abaixo de lg, só 1 coluna por vez (lista | thread | info) — acima de
// lg, as 3 ficam sempre visíveis lado a lado (ver classes lg:flex em
// cada wrapper abaixo). `mobileView` só importa nas telas pequenas.
type MobileView = "lista" | "thread" | "info";

export function AtendimentoView({ analistaAtual, telefoneInicial }: AtendimentoViewProps) {
  const {
    conversas,
    conversaSelecionadaId,
    textosProntos,
    templatesAprovados,
    isLoading,
    isSending,
    hasError,
    selecionarConversa,
    enviarMensagem,
    assumirAtendimento,
    encerrarAtendimento,
    solicitarTransferencia,
    responderTransferencia,
    limparSolicitacaoResolvida,
    criarTextoPronto,
    atualizarTextoPronto,
    removerTextoPronto,
  } = useAtendimento(analistaAtual, telefoneInicial);

  const [mobileView, setMobileView] = useState<MobileView>("lista");

  // Seleção automática por "?telefone=" pula direto pra thread no mobile
  // também — sem isso o analista chegaria numa lista vazia de contexto,
  // tendo que abrir a conversa de novo manualmente.
  useEffect(() => {
    if (telefoneInicial && conversaSelecionadaId) setMobileView("thread");
  }, [telefoneInicial, conversaSelecionadaId]);

  const conversaSelecionada =
    conversas.find((conversa) => conversa.id === conversaSelecionadaId) ?? null;

  function selecionarESeguir(id: string) {
    selecionarConversa(id);
    setMobileView("thread");
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Carregando conversas...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-destructive flex flex-1 items-center justify-center text-sm">
        Não foi possível carregar as conversas.
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex min-h-0 flex-1 overflow-hidden rounded-2xl border lg:grid lg:grid-cols-[280px_1fr_280px]">
      <div
        className={`min-h-0 min-w-0 flex-1 ${mobileView === "lista" ? "flex" : "hidden"} lg:flex`}
      >
        <ListaConversas
          conversas={conversas}
          conversaSelecionadaId={conversaSelecionadaId}
          onSelecionar={selecionarESeguir}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-1 ${mobileView === "thread" ? "flex" : "hidden"} lg:flex`}
      >
        <ThreadConversa
          conversa={conversaSelecionada}
          analistaAtual={analistaAtual}
          textosProntos={textosProntos}
          templatesAprovados={templatesAprovados}
          isSending={isSending}
          onAssumirAtendimento={assumirAtendimento}
          onEncerrarAtendimento={encerrarAtendimento}
          onSolicitarTransferencia={solicitarTransferencia}
          onResponderTransferencia={responderTransferencia}
          onLimparSolicitacaoResolvida={limparSolicitacaoResolvida}
          onEnviarMensagem={enviarMensagem}
          onCriarTextoPronto={criarTextoPronto}
          onAtualizarTextoPronto={atualizarTextoPronto}
          onRemoverTextoPronto={removerTextoPronto}
          onVoltarParaLista={() => setMobileView("lista")}
          onAbrirInformacoes={() => setMobileView("info")}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-1 ${mobileView === "info" ? "flex" : "hidden"} lg:flex`}
      >
        {conversaSelecionada ? (
          <PainelInformacoes
            conversaSelecionada={conversaSelecionada}
            todasConversas={conversas}
            onSelecionarConversa={selecionarESeguir}
            onVoltarParaConversa={() => setMobileView("thread")}
          />
        ) : (
          <div className="border-border w-full border-l" />
        )}
      </div>
    </div>
  );
}

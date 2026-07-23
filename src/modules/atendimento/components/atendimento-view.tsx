"use client";

import { useAtendimento } from "@/modules/atendimento/view-models/use-atendimento.view-model";
import { ListaConversas } from "@/modules/atendimento/components/lista-conversas";
import { ThreadConversa } from "@/modules/atendimento/components/thread-conversa";
import { PainelInformacoes } from "@/modules/atendimento/components/painel-informacoes";

interface AtendimentoViewProps {
  analistaAtual: string;
}

export function AtendimentoView({ analistaAtual }: AtendimentoViewProps) {
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
    criarTextoPronto,
  } = useAtendimento(analistaAtual);

  const conversaSelecionada =
    conversas.find((conversa) => conversa.id === conversaSelecionadaId) ?? null;

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-[calc(100vh-8rem)] items-center justify-center text-sm">
        Carregando conversas...
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-destructive flex h-[calc(100vh-8rem)] items-center justify-center text-sm">
        Não foi possível carregar as conversas.
      </div>
    );
  }

  return (
    <div className="border-border bg-card grid h-[calc(100vh-8rem)] grid-cols-[280px_1fr_280px] overflow-hidden rounded-2xl border">
      <ListaConversas
        conversas={conversas}
        conversaSelecionadaId={conversaSelecionadaId}
        onSelecionar={selecionarConversa}
      />

      <ThreadConversa
        conversa={conversaSelecionada}
        analistaAtual={analistaAtual}
        textosProntos={textosProntos}
        templatesAprovados={templatesAprovados}
        isSending={isSending}
        onAssumirAtendimento={assumirAtendimento}
        onEnviarMensagem={enviarMensagem}
        onCriarTextoPronto={criarTextoPronto}
      />

      {conversaSelecionada ? (
        <PainelInformacoes
          conversaSelecionada={conversaSelecionada}
          todasConversas={conversas}
          onSelecionarConversa={selecionarConversa}
        />
      ) : (
        <div className="border-border border-l" />
      )}
    </div>
  );
}

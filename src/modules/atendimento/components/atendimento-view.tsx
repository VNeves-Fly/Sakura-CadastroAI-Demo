"use client";

import { useEffect, useState } from "react";
import { useAtendimento } from "@/modules/atendimento/view-models/use-atendimento.view-model";
import { ListaConversas } from "@/modules/atendimento/components/lista-conversas";
import { ListaContatos } from "@/modules/atendimento/components/lista-contatos";
import { ModalEscolhaContato } from "@/modules/atendimento/components/modal-escolha-contato";
import { ThreadConversa } from "@/modules/atendimento/components/thread-conversa";
import { PainelInformacoes } from "@/modules/atendimento/components/painel-informacoes";

interface AtendimentoViewProps {
  analistaAtual: string;
  // "?telefone=" (ver AtendimentoButton, no dossiê da agência) — seleciona
  // de cara a conversa daquele contato ao entrar na página, se já existir.
  telefoneInicial?: string;
  // "?agenciaId=" (mesmo botão, agora simplificado) — abre o modal "com
  // quem você quer falar" quando a agência tem mais de 1 número, ou já
  // seleciona direto quando só tem 1.
  agenciaIdInicial?: string;
}

// Abaixo de lg, só 1 coluna por vez (lista | thread | info) — acima de
// lg, as 3 ficam sempre visíveis lado a lado (ver classes lg:flex em
// cada wrapper abaixo). `mobileView` só importa nas telas pequenas.
type MobileView = "lista" | "thread" | "info";

export function AtendimentoView({
  analistaAtual,
  telefoneInicial,
  agenciaIdInicial,
}: AtendimentoViewProps) {
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
    abaListaLateral,
    selecionarAba,
    contatos,
    buscaContatos,
    carregandoContatos,
    buscarContatos,
    modalEscolha,
    fecharModalEscolha,
    selecionarNumeroContato,
  } = useAtendimento(analistaAtual, telefoneInicial, agenciaIdInicial);

  const [mobileView, setMobileView] = useState<MobileView>("lista");

  // Seleção automática por "?telefone=" pula direto pra thread no mobile
  // também — sem isso o analista chegaria numa lista vazia de contexto,
  // tendo que abrir a conversa de novo manualmente.
  useEffect(() => {
    if ((telefoneInicial || agenciaIdInicial) && conversaSelecionadaId) setMobileView("thread");
  }, [telefoneInicial, agenciaIdInicial, conversaSelecionadaId]);

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
    <>
      <div className="border-border bg-card flex min-h-0 flex-1 overflow-hidden rounded-2xl border lg:grid lg:grid-cols-[280px_1fr_280px]">
        <div
          className={`min-h-0 min-w-0 flex-1 flex-col ${mobileView === "lista" ? "flex" : "hidden"} lg:flex`}
        >
          <div className="border-border bg-card flex shrink-0 gap-1 border-r border-b p-2">
            {(["conversas", "contatos"] as const).map((aba) => (
              <button
                key={aba}
                type="button"
                onClick={() => selecionarAba(aba)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  abaListaLateral === aba
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {aba === "conversas" ? "Conversas" : "Contatos"}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1">
            {abaListaLateral === "conversas" ? (
              <ListaConversas
                conversas={conversas}
                conversaSelecionadaId={conversaSelecionadaId}
                onSelecionar={selecionarESeguir}
              />
            ) : (
              <ListaContatos
                contatos={contatos}
                busca={buscaContatos}
                carregando={carregandoContatos}
                onBuscar={buscarContatos}
                onEscolherNumero={(numero) => {
                  void selecionarNumeroContato(numero);
                  setMobileView("thread");
                }}
              />
            )}
          </div>
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
              onEnviarMensagem={enviarMensagem}
            />
          ) : (
            <div className="border-border w-full border-l" />
          )}
        </div>
      </div>
      <ModalEscolhaContato
        modal={modalEscolha}
        onEscolher={(numero) => {
          void selecionarNumeroContato(numero);
          setMobileView("thread");
        }}
        onFechar={fecharModalEscolha}
      />
    </>
  );
}

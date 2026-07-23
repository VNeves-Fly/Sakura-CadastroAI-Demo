"use client";

import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Send,
  Plus,
  FileText,
  Music,
  MessageSquareText,
  Sparkles,
  X,
} from "lucide-react";
import type {
  Conversa,
  TextoPronto,
  TemplateAprovado,
  EnviarMensagemInput,
} from "@/modules/atendimento/types/atendimento.types";
import { MensagemBubble } from "@/modules/atendimento/components/mensagem-bubble";
import { AtendimentoAcoesBanner } from "@/modules/atendimento/components/atendimento-acoes-banner";
import {
  iniciaisNome,
  labelPapelMembro,
} from "@/modules/atendimento/utils/atendimento-formato.util";

const HORAS_JANELA_META = 24;

function janela24hFechada(conversa: Conversa): boolean {
  const ultimaMsgCliente = [...conversa.mensagens]
    .reverse()
    .find((mensagem) => mensagem.autor === "cliente");
  if (!ultimaMsgCliente) return true;
  const horas = (Date.now() - new Date(ultimaMsgCliente.createdAt).getTime()) / (1000 * 60 * 60);
  return horas > HORAS_JANELA_META;
}

function PainelMidia({ conversa, onFechar }: { conversa: Conversa; onFechar: () => void }) {
  const midias = conversa.mensagens.filter((mensagem) => mensagem.tipo !== "texto");

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-2 border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Mídias enviadas nesta conversa
        </span>
        <button
          type="button"
          onClick={onFechar}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      {midias.length === 0 ? (
        <p className="text-muted-foreground text-xs">Nenhuma mídia enviada ainda.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {midias.map((midia) => (
            <div
              key={midia.id}
              className="bg-card border-border flex w-24 shrink-0 flex-col items-center gap-1 rounded-lg border p-2"
            >
              {midia.tipo === "imagem" ? (
                <ImageIcon className="text-muted-foreground size-6" />
              ) : midia.tipo === "pdf" ? (
                <FileText className="text-muted-foreground size-6" />
              ) : (
                <Music className="text-muted-foreground size-6" />
              )}
              <span className="text-foreground w-full truncate text-center text-[10px]">
                {midia.conteudo}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextosProntosPicker({
  textosProntos,
  onEscolher,
  onCriar,
}: {
  textosProntos: TextoPronto[];
  onEscolher: (conteudo: string) => void;
  onCriar: (titulo: string, conteudo: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [tituloNovo, setTituloNovo] = useState("");
  const [conteudoNovo, setConteudoNovo] = useState("");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="border-input text-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
      >
        <MessageSquareText className="size-3.5" />
        Textos prontos
      </button>

      {aberto ? (
        <div className="border-border bg-card absolute bottom-full left-0 z-10 mb-2 flex w-72 flex-col gap-2 rounded-xl border p-3 shadow-xl">
          {textosProntos.length === 0 ? (
            <p className="text-muted-foreground text-xs">Nenhum texto pronto salvo ainda.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {textosProntos.map((texto) => (
                <button
                  key={texto.id}
                  type="button"
                  onClick={() => {
                    onEscolher(texto.conteudo);
                    setAberto(false);
                  }}
                  className="hover:bg-accent rounded-lg px-2 py-1.5 text-left"
                >
                  <span className="text-foreground block text-xs font-semibold">
                    {texto.titulo}
                  </span>
                  <span className="text-muted-foreground line-clamp-1 block text-xs">
                    {texto.conteudo}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="border-border border-t pt-2">
            {criando ? (
              <div className="flex flex-col gap-1.5">
                <input
                  value={tituloNovo}
                  onChange={(event) => setTituloNovo(event.target.value)}
                  placeholder="Título"
                  className="border-input bg-background rounded-lg border px-2 py-1 text-xs outline-none"
                />
                <textarea
                  value={conteudoNovo}
                  onChange={(event) => setConteudoNovo(event.target.value)}
                  placeholder="Texto"
                  rows={2}
                  className="border-input bg-background rounded-lg border px-2 py-1 text-xs outline-none"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!tituloNovo.trim() || !conteudoNovo.trim()) return;
                      await onCriar(tituloNovo.trim(), conteudoNovo.trim());
                      setTituloNovo("");
                      setConteudoNovo("");
                      setCriando(false);
                    }}
                    className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCriando(false)}
                    className="border-input rounded-full border px-2.5 py-1 text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCriando(true)}
                className="text-primary text-xs font-semibold hover:underline"
              >
                + Salvar novo texto pronto
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TemplatesAprovadosPicker({
  templatesAprovados,
  onEnviar,
}: {
  templatesAprovados: TemplateAprovado[];
  onEnviar: (conteudo: string) => void;
}) {
  return (
    <div className="border-warning/30 bg-warning/5 flex flex-col gap-2 border-t px-4 py-3">
      <span className="text-warning flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <Sparkles className="size-3.5" />
        Janela de 24h fechada — use um template aprovado pela Meta
      </span>
      <div className="flex flex-wrap gap-2">
        {templatesAprovados.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onEnviar(template.conteudo)}
            className="border-input bg-card hover:bg-accent rounded-full border px-3 py-1.5 text-left text-xs font-medium"
            title={template.conteudo}
          >
            {template.nome}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ThreadConversaProps {
  conversa: Conversa | null;
  analistaAtual: string;
  textosProntos: TextoPronto[];
  templatesAprovados: TemplateAprovado[];
  isSending: boolean;
  onAssumirAtendimento: (conversaId: string) => Promise<void>;
  onEncerrarAtendimento: (conversaId: string) => Promise<void>;
  onSolicitarTransferencia: (conversaId: string, paraAnalista: string) => Promise<void>;
  onResponderTransferencia: (conversaId: string, aceita: boolean) => Promise<void>;
  onLimparSolicitacaoResolvida: (conversaId: string) => Promise<void>;
  onEnviarMensagem: (conversaId: string, input: EnviarMensagemInput) => Promise<void>;
  onCriarTextoPronto: (titulo: string, conteudo: string) => Promise<void>;
}

export function ThreadConversa({
  conversa,
  analistaAtual,
  textosProntos,
  templatesAprovados,
  isSending,
  onAssumirAtendimento,
  onEncerrarAtendimento,
  onSolicitarTransferencia,
  onResponderTransferencia,
  onLimparSolicitacaoResolvida,
  onEnviarMensagem,
  onCriarTextoPronto,
}: ThreadConversaProps) {
  const [texto, setTexto] = useState("");
  const [mostrarMidia, setMostrarMidia] = useState(false);
  const fimDaListaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: "end" });
  }, [conversa?.mensagens.length]);

  useEffect(() => {
    setMostrarMidia(false);
    setTexto("");
  }, [conversa?.id]);

  if (!conversa) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Selecione uma conversa pra começar.
      </div>
    );
  }

  const janelaFechada = janela24hFechada(conversa);

  async function enviarTexto() {
    if (!conversa || !texto.trim()) return;
    await onEnviarMensagem(conversa.id, { tipo: "texto", conteudo: texto.trim() });
    setTexto("");
  }

  async function enviarTemplate(conteudo: string) {
    if (!conversa) return;
    await onEnviarMensagem(conversa.id, { tipo: "texto", conteudo });
  }

  // Anexar hoje só simula o envio (sem upload real — não existe
  // FileStorage ligado a este mock) — troque por um input de arquivo de
  // verdade quando o back-end desta área existir.
  async function anexarMock() {
    if (!conversa) return;
    await onEnviarMensagem(conversa.id, {
      tipo: "pdf",
      conteudo: "documento-anexado.pdf",
      tamanhoArquivo: "1.2 MB",
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold">
            {iniciaisNome(conversa.membro.nome)}
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">{conversa.membro.nome}</p>
            <p className="text-muted-foreground text-xs">
              {labelPapelMembro(conversa.membro.papel)} · {conversa.agenciaNome}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMostrarMidia((atual) => !atual)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mostrarMidia
              ? "bg-primary text-primary-foreground"
              : "border-input text-foreground hover:bg-accent border"
          }`}
        >
          <ImageIcon className="size-3.5" />
          Mídia
        </button>
      </div>

      {mostrarMidia ? (
        <PainelMidia conversa={conversa} onFechar={() => setMostrarMidia(false)} />
      ) : null}

      <AtendimentoAcoesBanner
        conversa={conversa}
        analistaAtual={analistaAtual}
        onAssumir={() => void onAssumirAtendimento(conversa.id)}
        onEncerrar={() => void onEncerrarAtendimento(conversa.id)}
        onSolicitarTransferencia={(paraAnalista) =>
          void onSolicitarTransferencia(conversa.id, paraAnalista)
        }
        onResponderTransferencia={(aceita) => void onResponderTransferencia(conversa.id, aceita)}
        onLimparSolicitacaoResolvida={() => void onLimparSolicitacaoResolvida(conversa.id)}
      />

      <div className="bg-muted/10 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversa.mensagens.map((mensagem) => (
          <MensagemBubble key={mensagem.id} mensagem={mensagem} />
        ))}
        <div ref={fimDaListaRef} />
      </div>

      {janelaFechada ? (
        <TemplatesAprovadosPicker
          templatesAprovados={templatesAprovados}
          onEnviar={(conteudo) => void enviarTemplate(conteudo)}
        />
      ) : (
        <div className="border-border flex items-center gap-2 border-t px-4 py-3">
          <TextosProntosPicker
            textosProntos={textosProntos}
            onEscolher={(conteudo) => setTexto(conteudo)}
            onCriar={onCriarTextoPronto}
          />
          <button
            type="button"
            onClick={() => void anexarMock()}
            title="Anexar arquivo"
            className="border-input text-foreground hover:bg-accent flex size-9 shrink-0 items-center justify-center rounded-full border transition"
          >
            <Plus className="size-4" />
          </button>
          <input
            type="text"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void enviarTexto();
              }
            }}
            placeholder="Digite uma mensagem"
            className="border-input bg-background placeholder:text-muted-foreground flex-1 rounded-full border px-4 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void enviarTexto()}
            disabled={isSending || !texto.trim()}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 flex size-9 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

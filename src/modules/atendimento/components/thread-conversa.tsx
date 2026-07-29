"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Send,
  Plus,
  FileText,
  Music,
  MessageSquareText,
  Sparkles,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  Info,
  ChevronUp,
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

function rotuloTemplate(template: TemplateAprovado): string {
  return template.titulo || template.nome;
}

// Conta quantas variáveis {{1}}, {{2}}... o corpo do template tem — a
// Meta só garante {{n}} sequencial a partir de 1, então o maior número
// encontrado já dá a quantidade de campos pra pedir.
function contarVariaveis(conteudo: string): number {
  const numeros = [...conteudo.matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
  return numeros.length > 0 ? Math.max(...numeros) : 0;
}

function substituirVariaveis(conteudo: string, valores: string[]): string {
  return conteudo.replace(/\{\{(\d+)\}\}/g, (match, indice) => {
    const valor = valores[Number(indice) - 1];
    return valor && valor.trim() ? valor.trim() : match;
  });
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
          {midias.map((midia) => {
            const url = midia.midiaId ? `/api/atendimento/midia/${midia.midiaId}` : null;
            const conteudoCartao = (
              <>
                {midia.tipo === "imagem" && url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={midia.conteudo || "Imagem enviada"}
                    className="size-12 rounded-md object-cover"
                  />
                ) : midia.tipo === "imagem" ? (
                  <ImageIcon className="text-muted-foreground size-6" />
                ) : midia.tipo === "pdf" ? (
                  <FileText className="text-muted-foreground size-6" />
                ) : (
                  <Music className="text-muted-foreground size-6" />
                )}
                <span className="text-foreground w-full truncate text-center text-[10px]">
                  {midia.conteudo || (midia.tipo === "audio" ? "Áudio" : midia.tipo)}
                </span>
              </>
            );

            return url ? (
              <a
                key={midia.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border-border hover:border-primary/40 flex w-24 shrink-0 flex-col items-center gap-1 rounded-lg border p-2 transition"
              >
                {conteudoCartao}
              </a>
            ) : (
              <div
                key={midia.id}
                className="bg-card border-border flex w-24 shrink-0 flex-col items-center gap-1 rounded-lg border p-2"
              >
                {conteudoCartao}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TextosProntosPicker({
  textosProntos,
  onEscolher,
  onCriar,
  onAtualizar,
  onRemover,
}: {
  textosProntos: TextoPronto[];
  onEscolher: (conteudo: string) => void;
  onCriar: (titulo: string, conteudo: string) => Promise<void>;
  onAtualizar: (id: string, titulo: string, conteudo: string) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tituloNovo, setTituloNovo] = useState("");
  const [conteudoNovo, setConteudoNovo] = useState("");

  function iniciarEdicao(texto: TextoPronto) {
    setEditandoId(texto.id);
    setCriando(false);
    setTituloNovo(texto.titulo);
    setConteudoNovo(texto.conteudo);
  }

  function cancelarFormulario() {
    setCriando(false);
    setEditandoId(null);
    setTituloNovo("");
    setConteudoNovo("");
  }

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
                <div
                  key={texto.id}
                  className="hover:bg-accent group flex items-start justify-between gap-1 rounded-lg px-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onEscolher(texto.conteudo);
                      setAberto(false);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="text-foreground block text-xs font-semibold">
                      {texto.titulo}
                    </span>
                    <span className="text-muted-foreground line-clamp-1 block text-xs">
                      {texto.conteudo}
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(texto)}
                      title="Editar"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRemover(texto.id)}
                      title="Apagar"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-border border-t pt-2">
            {criando || editandoId ? (
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
                      if (editandoId) {
                        await onAtualizar(editandoId, tituloNovo.trim(), conteudoNovo.trim());
                      } else {
                        await onCriar(tituloNovo.trim(), conteudoNovo.trim());
                      }
                      cancelarFormulario();
                    }}
                    className="bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={cancelarFormulario}
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

// Botão "+" do input — antes simulava anexar um arquivo, mas o analista
// não consegue mandar mídia nenhuma pro cliente de verdade (sem
// integração real com WhatsApp Business ainda) — vira o atalho pra
// mandar um template aprovado a qualquer momento (não só quando a janela
// de 24h está fechada, ver TemplatesAprovadosPicker abaixo pra esse caso
// obrigatório).
function TemplatesDropdownButton({
  templatesAprovados,
  onEnviar,
}: {
  templatesAprovados: TemplateAprovado[];
  onEnviar: (template: TemplateAprovado) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        title="Enviar template aprovado"
        className="border-input text-foreground hover:bg-accent flex size-9 shrink-0 items-center justify-center rounded-full border transition"
      >
        <Plus className="size-4" />
      </button>

      {aberto ? (
        <div className="border-border bg-card absolute bottom-full left-0 z-10 mb-2 flex w-72 flex-col gap-1 rounded-xl border p-3 shadow-xl">
          <span className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            Templates aprovados pela Meta
          </span>
          {templatesAprovados.length === 0 ? (
            <p className="text-muted-foreground text-xs">Nenhum template disponível.</p>
          ) : (
            templatesAprovados.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => {
                  onEnviar(template);
                  setAberto(false);
                }}
                className="hover:bg-accent rounded-lg px-2 py-1.5 text-left"
              >
                <span className="text-foreground block text-xs font-semibold">
                  {rotuloTemplate(template)}
                </span>
                <span className="text-muted-foreground line-clamp-1 block text-xs">
                  {template.conteudo}
                </span>
              </button>
            ))
          )}
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
  onEnviar: (template: TemplateAprovado) => void;
}) {
  return (
    <div className="border-warning/30 bg-warning/5 flex flex-col gap-2 border-t px-4 py-3">
      <span className="text-warning flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <Sparkles className="size-3.5" />
        Janela de 24h fechada — use um template aprovado pela Meta
      </span>
      {templatesAprovados.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Nenhum template aprovado disponível ainda. Cadastre ou sincronize os templates em{" "}
          <Link href="/cadastros/messenger" className="text-foreground font-medium underline">
            Configurações do Messenger
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {templatesAprovados.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onEnviar(template)}
              className="border-input bg-card hover:bg-accent rounded-full border px-3 py-1.5 text-left text-xs font-medium"
              title={template.conteudo}
            >
              {rotuloTemplate(template)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Só aparece quando o template tem {{n}} no corpo — pede um valor por
// variável antes de mandar, com pré-visualização do texto final.
function PreencherVariaveisModal({
  template,
  onConfirmar,
  onCancelar,
}: {
  template: TemplateAprovado;
  onConfirmar: (valores: string[]) => void;
  onCancelar: () => void;
}) {
  const totalVariaveis = contarVariaveis(template.conteudo);
  const [valores, setValores] = useState<string[]>(() => Array(totalVariaveis).fill(""));

  const preview = substituirVariaveis(template.conteudo, valores);
  const podeEnviar = valores.every((valor) => valor.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-card border-border w-full max-w-md rounded-2xl border p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-foreground min-w-0 truncate text-sm font-semibold">
            Preencher variáveis — {rotuloTemplate(template)}
          </span>
          <button
            type="button"
            onClick={onCancelar}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {valores.map((valor, indice) => (
            <label key={indice} className="flex flex-col gap-1">
              <span className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">
                Variável {indice + 1}
              </span>
              <input
                value={valor}
                autoFocus={indice === 0}
                onChange={(event) => {
                  const novosValores = [...valores];
                  novosValores[indice] = event.target.value;
                  setValores(novosValores);
                }}
                className="border-input bg-background text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </label>
          ))}
        </div>

        <div className="border-border bg-muted/30 mt-3 rounded-lg border border-dashed px-3 py-2 text-xs">
          <span className="text-muted-foreground mb-1 block text-[10px] font-bold tracking-wide uppercase">
            Pré-visualização
          </span>
          <p className="text-foreground">{preview}</p>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="border-input rounded-full border px-4 py-1.5 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!podeEnviar}
            onClick={() => onConfirmar(valores)}
            className="bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

// Mensagens mais recentes primeiro; "Carregar mensagens anteriores"
// revela mais 20 por vez — evita renderizar/carregar o histórico inteiro
// de uma vez só quando a conversa tiver muitas mensagens.
const PAGINA_MENSAGENS = 20;

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
  onAtualizarTextoPronto: (id: string, titulo: string, conteudo: string) => Promise<void>;
  onRemoverTextoPronto: (id: string) => Promise<void>;
  // Navegação só usada em telas pequenas (ver AtendimentoView) — em
  // desktop as 3 colunas ficam sempre visíveis e esses botões não
  // aparecem (escondidos via lg:hidden).
  onVoltarParaLista?: () => void;
  onAbrirInformacoes?: () => void;
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
  onAtualizarTextoPronto,
  onRemoverTextoPronto,
  onVoltarParaLista,
  onAbrirInformacoes,
}: ThreadConversaProps) {
  const [texto, setTexto] = useState("");
  const [mostrarMidia, setMostrarMidia] = useState(false);
  const [mensagensVisiveis, setMensagensVisiveis] = useState(PAGINA_MENSAGENS);
  const [templateEmPreenchimento, setTemplateEmPreenchimento] = useState<TemplateAprovado | null>(
    null,
  );
  const fimDaListaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: "end" });
  }, [conversa?.mensagens.length]);

  useEffect(() => {
    setMostrarMidia(false);
    setTexto("");
    setMensagensVisiveis(PAGINA_MENSAGENS);
    setTemplateEmPreenchimento(null);
  }, [conversa?.id]);

  if (!conversa) {
    return (
      <div className="text-muted-foreground flex h-full w-full min-w-0 flex-1 items-center justify-center text-sm">
        Selecione uma conversa pra começar.
      </div>
    );
  }

  const janelaFechada = janela24hFechada(conversa);
  // Responder só é permitido a quem assumiu o atendimento — decisão
  // explícita do usuário (2026-07-23): evita o analista "espiar" a
  // conversa sem realmente assumir a responsabilidade de atender.
  const podeResponder = conversa.atendimentoAtual?.analistaNome === analistaAtual;
  const totalMensagens = conversa.mensagens.length;
  const mensagensExibidas = conversa.mensagens.slice(
    Math.max(0, totalMensagens - mensagensVisiveis),
  );
  const restantes = totalMensagens - mensagensExibidas.length;

  async function enviarTexto() {
    if (!conversa || !texto.trim()) return;
    await onEnviarMensagem(conversa.id, { tipo: "texto", conteudo: texto.trim() });
    setTexto("");
  }

  async function enviarTemplateDireto(template: TemplateAprovado) {
    if (!conversa) return;
    await onEnviarMensagem(conversa.id, {
      tipo: "texto",
      conteudo: template.conteudo,
      templateId: template.id,
    });
  }

  // Templates sem {{n}} mandam direto; com variável, abre o modal de
  // preenchimento antes (ver PreencherVariaveisModal).
  function iniciarEnvioTemplate(template: TemplateAprovado) {
    if (contarVariaveis(template.conteudo) > 0) {
      setTemplateEmPreenchimento(template);
    } else {
      void enviarTemplateDireto(template);
    }
  }

  async function confirmarEnvioTemplateComVariaveis(valores: string[]) {
    if (!conversa || !templateEmPreenchimento) return;
    const template = templateEmPreenchimento;
    setTemplateEmPreenchimento(null);
    await onEnviarMensagem(conversa.id, {
      tipo: "texto",
      conteudo: substituirVariaveis(template.conteudo, valores),
      templateId: template.id,
      variaveis: valores,
    });
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onVoltarParaLista ? (
            <button
              type="button"
              onClick={onVoltarParaLista}
              aria-label="Voltar pra lista de conversas"
              className="text-muted-foreground hover:text-foreground shrink-0 lg:hidden"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <div className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
            {iniciaisNome(conversa.membro.nome)}
          </div>
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-semibold">{conversa.membro.nome}</p>
            <p className="text-muted-foreground truncate text-xs">
              {labelPapelMembro(conversa.membro.papel)} · {conversa.agenciaNome}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
            <span className="hidden sm:inline">Mídia</span>
          </button>
          {onAbrirInformacoes ? (
            <button
              type="button"
              onClick={onAbrirInformacoes}
              title="Informações da agência"
              className="border-input text-foreground hover:bg-accent flex size-9 items-center justify-center rounded-full border transition lg:hidden"
            >
              <Info className="size-4" />
            </button>
          ) : null}
        </div>
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
        {restantes > 0 ? (
          <div className="flex justify-center pb-1">
            <button
              type="button"
              onClick={() => setMensagensVisiveis((atual) => atual + PAGINA_MENSAGENS)}
              className="border-input bg-card text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
            >
              <ChevronUp className="size-3.5" />
              Carregar mensagens anteriores ({restantes})
            </button>
          </div>
        ) : null}
        {mensagensExibidas.map((mensagem) => (
          <MensagemBubble key={mensagem.id} mensagem={mensagem} agenciaId={conversa.agenciaId} />
        ))}
        <div ref={fimDaListaRef} />
      </div>

      {!podeResponder ? (
        <div className="border-border bg-muted/30 text-muted-foreground border-t px-4 py-3 text-center text-sm">
          {conversa.atendimentoAtual
            ? "Só quem assumiu o atendimento pode responder ao cliente."
            : "Assuma o atendimento pra poder responder ao cliente."}
        </div>
      ) : janelaFechada ? (
        <TemplatesAprovadosPicker
          templatesAprovados={templatesAprovados}
          onEnviar={iniciarEnvioTemplate}
        />
      ) : (
        <div className="border-border flex items-center gap-2 border-t px-4 py-3">
          <TextosProntosPicker
            textosProntos={textosProntos}
            onEscolher={(conteudo) => setTexto(conteudo)}
            onCriar={onCriarTextoPronto}
            onAtualizar={onAtualizarTextoPronto}
            onRemover={onRemoverTextoPronto}
          />
          <TemplatesDropdownButton
            templatesAprovados={templatesAprovados}
            onEnviar={iniciarEnvioTemplate}
          />
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

      {templateEmPreenchimento ? (
        <PreencherVariaveisModal
          template={templateEmPreenchimento}
          onConfirmar={(valores) => void confirmarEnvioTemplateComVariaveis(valores)}
          onCancelar={() => setTemplateEmPreenchimento(null)}
        />
      ) : null}
    </div>
  );
}

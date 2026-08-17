"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  FileWarning,
  Users,
  History,
  ClipboardList,
  ExternalLink,
  ChevronLeft,
  Link2,
} from "lucide-react";
import type {
  Conversa,
  DocumentoParaRevisar,
  EnviarMensagemInput,
  VincularConversaAgenciaInput,
} from "@/modules/atendimento/types/atendimento.types";
import {
  iniciaisNome,
  labelPapelMembro,
  formatarTempoDecorrido,
} from "@/modules/atendimento/utils/atendimento-formato.util";
import { VincularConversaModal } from "@/modules/atendimento/components/vincular-conversa-modal";

const LABEL_TIPO_DOCUMENTO: Record<string, string> = {
  CONTRATO_SOCIAL: "Contrato Social",
  RG_CNPJ: "RG/CNH",
  PROCURACAO: "Procuração",
};

// Mesmo cálculo de thread-conversa.tsx (duplicado, não exportado de lá) —
// texto livre com link só é aceito pelo WhatsApp se o cliente mandou
// mensagem há menos de 24h; passado isso, precisaria de template
// aprovado pela Meta (ver EnviarMensagemUseCase).
function janela24hFechada(conversa: Conversa): boolean {
  const ultimaMsgCliente = [...conversa.mensagens]
    .reverse()
    .find((mensagem) => mensagem.autor === "cliente");
  if (!ultimaMsgCliente) return true;
  const horas = (Date.now() - new Date(ultimaMsgCliente.createdAt).getTime()) / (1000 * 60 * 60);
  return horas > 24;
}

// Flagar documentos pendentes/reprovados e mandar o link de reenvio
// (mesma página pública que o dossiê já usa,
// /cadastro/documentos-pendentes/[agenciaId]) direto como mensagem no
// chat — decisão do usuário (2026-07-27): o analista não precisa mais
// sair do /atendimento pra cobrar documento. Quando o cliente reenviar
// por esse link, o documento já entra como "reenviado" na ficha
// automaticamente (mesma mecânica que o dossiê já usa, nada novo aqui).
function SecaoDocumentosParaRevisar({
  conversa,
  onEnviarMensagem,
}: {
  conversa: Conversa;
  onEnviarMensagem: (conversaId: string, input: EnviarMensagemInput) => Promise<void>;
}) {
  const documentos = conversa.resumoFicha.documentosParaRevisar;
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);

  if (!conversa.agenciaId || documentos.length === 0) return null;

  function alternar(documentoId: string) {
    setErro(null);
    setEnviadoComSucesso(false);
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(documentoId)) {
        novo.delete(documentoId);
      } else {
        novo.add(documentoId);
      }
      return novo;
    });
  }

  function labelDocumento(documento: DocumentoParaRevisar): string {
    const tipo = LABEL_TIPO_DOCUMENTO[documento.tipo] ?? documento.tipo;
    return documento.nomeSocio ? `${tipo} — ${documento.nomeSocio}` : tipo;
  }

  async function enviarLink() {
    const marcados = documentos.filter((documento) => selecionados.has(documento.id));
    if (marcados.length === 0 || !conversa.agenciaId) return;

    setEnviando(true);
    setErro(null);
    try {
      const link = `${window.location.origin}/cadastro/documentos-pendentes/${conversa.agenciaId}`;
      const conteudo = `Olá! Notamos pendência nos seguintes documentos: ${marcados
        .map(labelDocumento)
        .join(", ")}. Envie a versão atualizada por este link: ${link}`;
      await onEnviarMensagem(conversa.id, { tipo: "texto", conteudo });
      setSelecionados(new Set());
      setEnviadoComSucesso(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  const janelaFechada = janela24hFechada(conversa);

  return (
    <div className="border-border border-t pt-3">
      <span className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
        <FileWarning className="size-3.5" />
        Documentos pendentes/reprovados ({documentos.length})
      </span>

      <div className="flex flex-col gap-2">
        {documentos.map((documento) => (
          <label key={documento.id} className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={selecionados.has(documento.id)}
              onChange={() => alternar(documento.id)}
              className="mt-0.5"
            />
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5">
                <span className="text-foreground font-medium">{labelDocumento(documento)}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    documento.status === "REPROVADO"
                      ? "bg-destructive-bg text-destructive-text"
                      : "bg-warning-bg text-warning-text"
                  }`}
                >
                  {documento.status === "REPROVADO" ? "Reprovado" : "Pendente"}
                </span>
              </span>
              {documento.motivoReprovacao ? (
                <span className="text-muted-foreground">{documento.motivoReprovacao}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={enviarLink}
        disabled={selecionados.size === 0 || enviando}
        className="bg-primary text-primary-foreground hover:bg-sakura-600 mt-2 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar link de reenvio"}
      </button>

      {janelaFechada ? (
        <p className="text-warning-text mt-1.5 text-[11px]">
          Cliente sem mensagem há mais de 24h — o WhatsApp pode recusar texto livre.
        </p>
      ) : null}
      {erro ? <p className="text-destructive mt-1.5 text-xs">{erro}</p> : null}
      {enviadoComSucesso ? (
        <p className="text-success mt-1.5 text-xs">Link enviado no chat.</p>
      ) : null}
    </div>
  );
}

// Ativo/Reprovado é dossiê do Arquivo (/arquivo/[id]); qualquer outro
// status ainda está em andamento no funil (/cadastros/[id]) — mesmo
// critério já usado nessas duas páginas reais. Como o /atendimento hoje
// é 100% mock (ver atendimento.types.ts), o agenciaId aqui não bate com
// nenhuma Agencia real do banco ainda — o link já sai certo, só passa a
// resolver de verdade quando este módulo for ligado ao back-end.
function linkFichaCliente(conversa: Conversa): string {
  const { statusAgencia } = conversa.resumoFicha;
  return statusAgencia === "ativo" || statusAgencia === "recusado"
    ? `/arquivo/${conversa.agenciaId}`
    : `/cadastros/${conversa.agenciaId}`;
}

const LABEL_STATUS_AGENCIA: Record<Conversa["resumoFicha"]["statusAgencia"], string> = {
  ativo: "Ativo",
  recusado: "Reprovado",
  em_andamento: "Em andamento no funil",
};

const CLASSES_STATUS_AGENCIA: Record<Conversa["resumoFicha"]["statusAgencia"], string> = {
  ativo: "bg-success-bg text-success-text",
  recusado: "bg-destructive-bg text-destructive-text",
  em_andamento: "bg-warning-bg text-warning-text",
};

interface PainelInformacoesProps {
  conversaSelecionada: Conversa;
  todasConversas: Conversa[];
  onSelecionarConversa: (id: string) => void;
  // Só usado em telas pequenas (ver AtendimentoView) — em desktop as 3
  // colunas ficam sempre visíveis e esse botão não aparece (lg:hidden).
  onVoltarParaConversa?: () => void;
  onEnviarMensagem: (conversaId: string, input: EnviarMensagemInput) => Promise<void>;
  onVincularAgencia: (conversaId: string, input: VincularConversaAgenciaInput) => Promise<void>;
}

export function PainelInformacoes({
  conversaSelecionada,
  todasConversas,
  onSelecionarConversa,
  onVoltarParaConversa,
  onEnviarMensagem,
  onVincularAgencia,
}: PainelInformacoesProps) {
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  // Contatos "não identificados" (agenciaId null) não têm agência em
  // comum — agrupar por igualdade de null juntaria conversas de pessoas
  // diferentes só porque nenhuma bateu com uma agência. Cada uma vira seu
  // próprio grupo de 1 membro nesse caso.
  const membrosDaAgencia =
    conversaSelecionada.agenciaId === null
      ? [conversaSelecionada]
      : todasConversas.filter((conversa) => conversa.agenciaId === conversaSelecionada.agenciaId);

  const imagens = conversaSelecionada.mensagens.filter((mensagem) => mensagem.tipo === "imagem");
  const arquivos = conversaSelecionada.mensagens.filter((mensagem) => mensagem.tipo === "pdf");
  const { resumoFicha } = conversaSelecionada;

  return (
    <div className="border-border bg-card flex h-full w-full min-w-0 flex-col overflow-y-auto border-l">
      <div className="border-border relative flex flex-col items-center gap-2 border-b p-5 text-center">
        {onVoltarParaConversa ? (
          <button
            type="button"
            onClick={onVoltarParaConversa}
            aria-label="Voltar pra conversa"
            className="text-muted-foreground hover:text-foreground absolute top-5 left-4 lg:hidden"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Informações da Agência
        </span>
        <div className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full text-lg font-bold">
          {iniciaisNome(conversaSelecionada.agenciaNome)}
        </div>
        <p className="text-foreground text-sm font-semibold">{conversaSelecionada.agenciaNome}</p>
        {conversaSelecionada.agenciaId ? (
          <Link
            href={linkFichaCliente(conversaSelecionada)}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
          >
            <ExternalLink className="size-3.5" />
            Ver ficha completa
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setModalVincularAberto(true)}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
          >
            <Link2 className="size-3.5" />
            Vincular a um cadastro
          </button>
        )}
      </div>

      <VincularConversaModal
        aberto={modalVincularAberto}
        onFechar={() => setModalVincularAberto(false)}
        onConfirmar={(input) => onVincularAgencia(conversaSelecionada.id, input)}
      />

      <div className="border-border flex flex-col gap-2 border-b p-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            <Users className="size-3.5" />
            Membros ({membrosDaAgencia.length})
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {membrosDaAgencia.map((conversa) => {
            const naoLidas = conversa.mensagens.filter(
              (mensagem) => mensagem.autor === "cliente" && !mensagem.lido,
            ).length;
            const ativa = conversa.id === conversaSelecionada.id;
            return (
              <button
                key={conversa.id}
                type="button"
                onClick={() => onSelecionarConversa(conversa.id)}
                className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                  ativa ? "bg-accent" : "hover:bg-muted/40"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-foreground truncate text-xs font-semibold">
                    {conversa.membro.nome}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">
                    {labelPapelMembro(conversa.membro.papel)} · {conversa.membro.telefone}
                  </p>
                </div>
                {naoLidas > 0 ? (
                  <span className="bg-success text-success-foreground flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                    {naoLidas}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border border-b p-4">
        <span className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <ImageIcon className="size-3.5" />
          Imagens ({imagens.length})
        </span>
        {imagens.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nenhuma imagem enviada ainda.</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {imagens.map((imagem) =>
              imagem.midiaId ? (
                <a
                  key={imagem.id}
                  href={`/api/atendimento/midia/${imagem.midiaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={imagem.conteudo || "Ver imagem"}
                  className="bg-muted/40 block aspect-square overflow-hidden rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/atendimento/midia/${imagem.midiaId}`}
                    alt={imagem.conteudo || "Imagem enviada"}
                    className="size-full object-cover"
                  />
                </a>
              ) : (
                <div
                  key={imagem.id}
                  className="bg-muted/40 flex aspect-square items-center justify-center rounded-md"
                  title={imagem.conteudo}
                >
                  <ImageIcon className="text-muted-foreground size-4" />
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="border-border border-b p-4">
        <span className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <FileText className="size-3.5" />
          Arquivos ({arquivos.length})
        </span>
        {arquivos.length === 0 ? (
          <p className="text-muted-foreground text-xs">Nenhum arquivo enviado ainda.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {arquivos.map((arquivo) => {
              const conteudoLinha = (
                <>
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="text-foreground truncate">{arquivo.conteudo}</span>
                  {arquivo.tamanhoArquivo ? (
                    <span className="text-muted-foreground shrink-0">{arquivo.tamanhoArquivo}</span>
                  ) : null}
                </>
              );

              return arquivo.midiaId ? (
                <a
                  key={arquivo.id}
                  href={`/api/atendimento/midia/${arquivo.midiaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary flex items-center gap-2 text-xs"
                >
                  {conteudoLinha}
                </a>
              ) : (
                <div key={arquivo.id} className="flex items-center gap-2 text-xs">
                  {conteudoLinha}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
          <ClipboardList className="size-3.5" />
          Resumo da ficha
        </span>

        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${CLASSES_STATUS_AGENCIA[resumoFicha.statusAgencia]}`}
        >
          {LABEL_STATUS_AGENCIA[resumoFicha.statusAgencia]}
        </span>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Documentos</dt>
            <dd className="text-foreground font-medium">
              {resumoFicha.documentosAprovados} aprovado(s), {resumoFicha.documentosPendentes}{" "}
              pendente(s)
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Receita</dt>
            <dd className="text-foreground font-medium">
              {resumoFicha.situacaoCadastralReceita ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Contrato</dt>
            <dd className="text-foreground font-medium">{resumoFicha.contratoStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">AMAT/SOFIA</dt>
            <dd className="text-foreground font-medium">
              {resumoFicha.amatSofiaConsultado ? "Já consultado" : "Ainda não consultado"}
            </dd>
          </div>
        </dl>

        <SecaoDocumentosParaRevisar
          conversa={conversaSelecionada}
          onEnviarMensagem={onEnviarMensagem}
        />

        <div className="border-border border-t pt-3">
          <span className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
            <History className="size-3.5" />
            Histórico de atendimentos
          </span>
          {conversaSelecionada.historicoAtendimento.length === 0 ? (
            <p className="text-muted-foreground text-xs">Nenhum atendimento assumido ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {[...conversaSelecionada.historicoAtendimento].reverse().map((registro, index) => (
                <li key={index} className="text-xs">
                  <span className="text-foreground font-semibold">{registro.analistaNome}</span>{" "}
                  <span className="text-muted-foreground">
                    assumiu {formatarTempoDecorrido(registro.assumidoEm)}
                    {registro.liberadoEm ? " · já liberou" : " · em andamento"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

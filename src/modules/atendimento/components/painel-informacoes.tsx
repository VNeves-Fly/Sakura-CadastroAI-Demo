"use client";

import Link from "next/link";
import {
  Image as ImageIcon,
  FileText,
  Users,
  History,
  ClipboardList,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import type { Conversa } from "@/modules/atendimento/types/atendimento.types";
import {
  iniciaisNome,
  labelPapelMembro,
  formatarTempoDecorrido,
} from "@/modules/atendimento/utils/atendimento-formato.util";

// Ativo/Reprovado é dossiê do Arquivo (/arquivo/[id]); qualquer outro
// status ainda está em andamento no funil (/painel/[id]) — mesmo
// critério já usado nessas duas páginas reais. Como o /atendimento hoje
// é 100% mock (ver atendimento.types.ts), o agenciaId aqui não bate com
// nenhuma Agencia real do banco ainda — o link já sai certo, só passa a
// resolver de verdade quando este módulo for ligado ao back-end.
function linkFichaCliente(conversa: Conversa): string {
  const { statusAgencia } = conversa.resumoFicha;
  return statusAgencia === "ativo" || statusAgencia === "recusado"
    ? `/arquivo/${conversa.agenciaId}`
    : `/painel/${conversa.agenciaId}`;
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
}

export function PainelInformacoes({
  conversaSelecionada,
  todasConversas,
  onSelecionarConversa,
  onVoltarParaConversa,
}: PainelInformacoesProps) {
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
        <Link
          href={linkFichaCliente(conversaSelecionada)}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
        >
          <ExternalLink className="size-3.5" />
          Ver ficha completa
        </Link>
      </div>

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

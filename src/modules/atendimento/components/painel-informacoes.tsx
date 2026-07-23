"use client";

import { Image as ImageIcon, FileText, Users, History, ClipboardList } from "lucide-react";
import type { Conversa } from "@/modules/atendimento/types/atendimento.types";
import {
  iniciaisNome,
  labelPapelMembro,
  formatarTempoDecorrido,
} from "@/modules/atendimento/utils/atendimento-formato.util";

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
}

export function PainelInformacoes({
  conversaSelecionada,
  todasConversas,
  onSelecionarConversa,
}: PainelInformacoesProps) {
  const membrosDaAgencia = todasConversas.filter(
    (conversa) => conversa.agenciaId === conversaSelecionada.agenciaId,
  );

  const imagens = conversaSelecionada.mensagens.filter((mensagem) => mensagem.tipo === "imagem");
  const arquivos = conversaSelecionada.mensagens.filter((mensagem) => mensagem.tipo === "pdf");
  const { resumoFicha } = conversaSelecionada;

  return (
    <div className="border-border bg-card flex h-full w-full flex-col overflow-y-auto border-l">
      <div className="border-border flex flex-col items-center gap-2 border-b p-5 text-center">
        <span className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
          Informações da Agência
        </span>
        <div className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full text-lg font-bold">
          {iniciaisNome(conversaSelecionada.agenciaNome)}
        </div>
        <p className="text-foreground text-sm font-semibold">{conversaSelecionada.agenciaNome}</p>
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
            {imagens.map((imagem) => (
              <div
                key={imagem.id}
                className="bg-muted/40 flex aspect-square items-center justify-center rounded-md"
                title={imagem.conteudo}
              >
                <ImageIcon className="text-muted-foreground size-4" />
              </div>
            ))}
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
            {arquivos.map((arquivo) => (
              <div key={arquivo.id} className="flex items-center gap-2 text-xs">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <span className="text-foreground truncate">{arquivo.conteudo}</span>
                {arquivo.tamanhoArquivo ? (
                  <span className="text-muted-foreground shrink-0">{arquivo.tamanhoArquivo}</span>
                ) : null}
              </div>
            ))}
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

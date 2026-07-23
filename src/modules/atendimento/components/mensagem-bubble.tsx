"use client";

import { Play, FileText, Check, CheckCheck, ImageIcon } from "lucide-react";
import type { Mensagem } from "@/modules/atendimento/types/atendimento.types";
import { formatarHorarioMensagem } from "@/modules/atendimento/utils/atendimento-formato.util";

// Selo de status estilo WhatsApp — só faz sentido em mensagens enviadas
// pelo analista (a "leitura" é do lado do cliente). Como não existe
// webhook real de confirmação de leitura ainda (ver
// atendimento.store.ts), toda mensagem enviada fica só "entregue" (1
// check) — nunca simula um "lido" (2 checks azuis) que não aconteceu de
// verdade.
function SeloStatus({ lido }: { lido: boolean }) {
  return lido ? (
    <CheckCheck className="text-info size-3.5" />
  ) : (
    <Check className="text-muted-foreground/70 size-3.5" />
  );
}

function ConteudoMensagem({ mensagem }: { mensagem: Mensagem }) {
  switch (mensagem.tipo) {
    case "audio":
      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full"
          >
            <Play className="size-4" fill="currentColor" />
          </button>
          <div className="h-1 w-32 rounded-full bg-current/20 opacity-40" />
          <span className="text-xs opacity-80">
            {mensagem.duracaoSegundos ? `${mensagem.duracaoSegundos}s` : ""}
          </span>
        </div>
      );
    case "imagem":
      return (
        <div className="flex flex-col gap-1">
          <div className="bg-muted/40 flex h-32 w-48 items-center justify-center rounded-lg">
            <ImageIcon className="text-muted-foreground size-8" />
          </div>
          <span className="text-xs opacity-80">{mensagem.conteudo}</span>
        </div>
      );
    case "pdf":
      return (
        <div className="flex items-center gap-2">
          <FileText className="size-6 shrink-0 opacity-80" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{mensagem.conteudo}</span>
            {mensagem.tamanhoArquivo ? (
              <span className="text-xs opacity-70">{mensagem.tamanhoArquivo}</span>
            ) : null}
          </div>
        </div>
      );
    default:
      return <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>;
  }
}

export function MensagemBubble({ mensagem }: { mensagem: Mensagem }) {
  const doAnalista = mensagem.autor === "analista";

  return (
    <div className={`flex ${doAnalista ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[70%] flex-col gap-1 rounded-2xl px-3 py-2 ${
          doAnalista
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border-border rounded-bl-sm border"
        }`}
      >
        {doAnalista && mensagem.analistaNome ? (
          <span className="text-[10px] font-bold tracking-wide uppercase opacity-80">
            {mensagem.analistaNome}
          </span>
        ) : null}
        <ConteudoMensagem mensagem={mensagem} />
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] opacity-70">
            {formatarHorarioMensagem(mensagem.createdAt)}
          </span>
          {doAnalista ? <SeloStatus lido={mensagem.lido} /> : null}
        </div>
      </div>
    </div>
  );
}

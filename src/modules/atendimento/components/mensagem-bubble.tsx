"use client";

import { useRef, useState } from "react";
import { Play, Pause, FileText, Check, CheckCheck, ImageIcon, Download, X } from "lucide-react";
import type { Mensagem } from "@/modules/atendimento/types/atendimento.types";
import { formatarHorarioMensagem } from "@/modules/atendimento/utils/atendimento-formato.util";

function urlMidia(midiaId: string): string {
  return `/api/atendimento/midia/${midiaId}`;
}

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

function PlayerAudio({ mensagem }: { mensagem: Mensagem }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  if (!mensagem.midiaId) {
    return <p className="text-xs opacity-70">Áudio indisponível.</p>;
  }

  const url = urlMidia(mensagem.midiaId);

  function alternarPlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => {
          setTocando(false);
          setProgresso(0);
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (audio.duration) setProgresso(audio.currentTime / audio.duration);
        }}
      />
      <button
        type="button"
        onClick={alternarPlay}
        aria-label={tocando ? "Pausar áudio" : "Tocar áudio"}
        className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
      >
        {tocando ? (
          <Pause className="size-4" fill="currentColor" />
        ) : (
          <Play className="size-4" fill="currentColor" />
        )}
      </button>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-current/20">
        <div
          className="h-full rounded-full bg-current transition-[width]"
          style={{ width: `${progresso * 100}%` }}
        />
      </div>
      <span className="text-xs opacity-80">
        {mensagem.duracaoSegundos ? `${mensagem.duracaoSegundos}s` : ""}
      </span>
      <a
        href={url}
        download
        aria-label="Baixar áudio"
        className="opacity-60 transition hover:opacity-100"
      >
        <Download className="size-3.5" />
      </a>
    </div>
  );
}

function ImagemMensagem({ mensagem }: { mensagem: Mensagem }) {
  const [aberta, setAberta] = useState(false);

  if (!mensagem.midiaId) {
    return (
      <div className="bg-muted/40 flex h-32 w-48 items-center justify-center rounded-lg">
        <ImageIcon className="text-muted-foreground size-8" />
      </div>
    );
  }

  const url = urlMidia(mensagem.midiaId);
  const legenda = mensagem.conteudo || "Imagem enviada";

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className="block overflow-hidden rounded-lg"
        aria-label="Ver imagem em tamanho maior"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={legenda} className="h-32 w-48 object-cover" />
      </button>

      {aberta ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={legenda}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setAberta(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={legenda}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <a
            href={url}
            download
            onClick={(event) => event.stopPropagation()}
            className="absolute top-4 right-16 flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            <Download className="size-4" />
            Baixar
          </a>
          <button
            type="button"
            onClick={() => setAberta(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function PdfMensagem({ mensagem }: { mensagem: Mensagem }) {
  const conteudo = (
    <>
      <FileText className="size-6 shrink-0 opacity-80" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{mensagem.conteudo}</span>
        {mensagem.tamanhoArquivo ? (
          <span className="text-xs opacity-70">{mensagem.tamanhoArquivo}</span>
        ) : null}
      </div>
    </>
  );

  if (!mensagem.midiaId) {
    return <div className="flex items-center gap-2">{conteudo}</div>;
  }

  const url = urlMidia(mensagem.midiaId);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 underline-offset-2 hover:underline"
    >
      {conteudo}
      <Download className="ml-1 size-3.5 shrink-0 opacity-60" />
    </a>
  );
}

function ConteudoMensagem({ mensagem }: { mensagem: Mensagem }) {
  switch (mensagem.tipo) {
    case "audio":
      return <PlayerAudio mensagem={mensagem} />;
    case "imagem":
      return <ImagemMensagem mensagem={mensagem} />;
    case "pdf":
      return <PdfMensagem mensagem={mensagem} />;
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

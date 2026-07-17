"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";
import type { ChatMessage } from "./types";

const AVATAR_SRC = "/logos/logo-sakura-oficial.png";

function useEntradaBounce() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    animate(el, { scale: [0.4, 1], opacity: [0, 1], duration: 450, ease: "outBack" });
  }, []);

  return ref;
}

function BotAvatar() {
  return (
    <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white">
      <Image src={AVATAR_SRC} alt="Sakura" fill className="object-contain p-0.5" />
    </div>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0">
      <path
        d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ChatBubble({ mensagem }: { mensagem: ChatMessage }) {
  const ref = useEntradaBounce();

  if (mensagem.autor === "bot" && mensagem.tipo === "loading") {
    return (
      <div ref={ref} className="mb-4 ml-9 flex origin-bottom-left items-end gap-2">
        <BotAvatar />
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-none bg-white/10 px-4 py-3.5">
          <span className="size-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-white/60" />
        </div>
      </div>
    );
  }

  if (mensagem.autor === "bot" && mensagem.tipo === "resumo") {
    return (
      <div ref={ref} className="mb-4 ml-9 flex origin-bottom-left items-end gap-2">
        <BotAvatar />
        <div className="max-w-[240px] rounded-2xl rounded-bl-none bg-white/10 px-4 py-3 text-[11px] leading-relaxed text-white/90">
          <ul className="flex flex-col gap-1">
            {mensagem.itens.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span className="text-accent">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (mensagem.autor === "bot") {
    return (
      <div ref={ref} className="mb-4 ml-9 flex origin-bottom-left items-end gap-2">
        <BotAvatar />
        <div className="max-w-[220px] rounded-2xl rounded-bl-none bg-white/10 px-4 py-2.5 text-[11px] leading-relaxed text-white/90">
          {mensagem.conteudo}
        </div>
      </div>
    );
  }

  if (mensagem.tipo === "arquivo") {
    return (
      <div ref={ref} className="mb-4 flex origin-bottom-right justify-end">
        <div className="from-primary to-secondary flex max-w-[220px] items-center gap-2 rounded-2xl rounded-br-none bg-gradient-to-br px-4 py-2.5 text-[11px] text-white">
          <FileIcon />
          <span className="truncate">{mensagem.nomeArquivo}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="mb-4 flex origin-bottom-right justify-end">
      <div className="from-primary to-secondary max-w-[220px] rounded-2xl rounded-br-none bg-gradient-to-br px-4 py-2.5 text-[11px] leading-relaxed text-white">
        {mensagem.conteudo}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";
import type { ResultadoFinalChat } from "./types";

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.2a8.17 8.17 0 0 1-4.17-1.14l-.3-.18-3 .79.8-2.93-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.08-.4-.12-.56.13-.17.25-.65.8-.8.96-.15.17-.3.19-.55.06-.25-.12-1.07-.4-2.04-1.26-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.38.11-.5.11-.11.25-.3.37-.44.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.9 2.4 1.02 2.57.12.17 1.77 2.7 4.3 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

const CORES_FUNDO: Record<ResultadoFinalChat["tipo"], string> = {
  aprovado: "bg-gradient-to-br from-success to-[hsl(153,59%,25%)]",
  manual: "from-primary to-secondary bg-gradient-to-br",
  duplicado: "from-primary to-secondary bg-gradient-to-br",
};

// Estrutura adaptada de um "profile card" (header com avatar/nome, bio,
// links sociais) pra reaproveitar como tela de veredito — cores e
// tipografia seguem os mesmos tokens do resto do app (bg-card,
// text-primary etc.), não uma paleta nova.
export function ResultadoFinal({ resultado }: { resultado: ResultadoFinalChat }) {
  const aprovado = resultado.tipo === "aprovado";
  const fundoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fundo = fundoRef.current;
    const card = cardRef.current;
    if (!fundo || !card) return;

    if (prefereMovimentoReduzido()) return;

    animate(fundo, { opacity: [0, 1], duration: 450, ease: "outCubic" });
    animate(card, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 550,
      delay: 120,
      ease: "outCubic",
    });
  }, []);

  return (
    <div
      ref={fundoRef}
      className={`fixed inset-0 z-50 flex items-center justify-center px-6 ${CORES_FUNDO[resultado.tipo]}`}
    >
      <div
        ref={cardRef}
        className="bg-card w-full max-w-xs overflow-hidden rounded-[2rem] text-center shadow-2xl shadow-black/30"
      >
        <div className="border-border flex flex-col items-center gap-1 border-b border-dashed px-6 py-8">
          <span className="border-accent relative mb-2 inline-block size-16 overflow-hidden rounded-full border-4 shadow-[0_0_0_8px_rgba(0,0,0,0.04)]">
            <Image
              src="/logos/favicon.png"
              alt="Sakura"
              fill
              priority
              className="object-contain p-2"
            />
          </span>
          <h1 className="text-primary text-xl font-semibold tracking-wide">SAKURA</h1>
          <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            Consolidadora
          </h2>
        </div>

        <div className="flex flex-col gap-2 px-6 py-6 text-sm">
          <p className="text-foreground font-semibold">{resultado.titulo}</p>
          <p className="text-muted-foreground">{resultado.mensagem}</p>
        </div>

        <ul className="border-border flex justify-center gap-6 border-t border-dashed px-6 py-5">
          <li>
            <span className="bg-muted text-foreground flex size-10 items-center justify-center rounded-full">
              <WhatsAppIcon className="size-5" />
            </span>
          </li>
          <li>
            {aprovado ? (
              <span className="bg-muted text-foreground flex size-10 items-center justify-center rounded-full">
                <InstagramIcon className="size-5" />
              </span>
            ) : (
              <span className="border-border relative inline-block size-10 overflow-hidden rounded-full border bg-white">
                <Image
                  src="/logos/favicon.png"
                  alt="Sakura"
                  fill
                  priority
                  className="object-contain p-1"
                />
              </span>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

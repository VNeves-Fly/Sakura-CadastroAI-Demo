"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate } from "animejs";
import { WhatsAppIcon } from "@/modules/cadastro/components/icons";
import { WHATSAPP_LINK_ATENDIMENTO } from "@/modules/shared/utils/whatsapp.util";
import type { ResultadoFinalChat } from "./types";

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
  const precisaRevisaoManual = resultado.tipo === "manual";
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

          {precisaRevisaoManual ? (
            <>
              <p className="text-muted-foreground">
                Ficou com alguma dúvida? Fale com um de nossos atendentes pelo WhatsApp.
              </p>
              <a
                href={WHATSAPP_LINK_ATENDIMENTO}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-success hover:bg-success/90 mt-1 flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
              >
                <WhatsAppIcon className="size-4" />
                Falar no WhatsApp
              </a>
            </>
          ) : null}
        </div>

        <ul className="border-border flex justify-center gap-6 border-t border-dashed px-6 py-5">
          <li>
            <a
              href={WHATSAPP_LINK_ATENDIMENTO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              className="bg-muted text-foreground hover:bg-accent flex size-10 items-center justify-center rounded-full transition"
            >
              <WhatsAppIcon className="size-5" />
            </a>
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

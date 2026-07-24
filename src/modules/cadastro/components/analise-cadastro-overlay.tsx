"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon } from "@/modules/cadastro/components/icons";
import { WHATSAPP_LINK_ATENDIMENTO } from "@/modules/shared/utils/whatsapp.util";

export type FaseAnaliseCadastro = "analisando" | "aprovado" | "revisao";

interface AnaliseCadastroOverlayProps {
  fase: FaseAnaliseCadastro;
}

const FRASES = [
  "CNPJ na Receita Federal",
  "Contrato social",
  "Quadro societário",
  "Documentos enviados",
  "Endereço informado",
  "Dados bancários",
  "Aguarde",
];

const ALTURA_LINHA = 50;
const INTERVALO_FRASE_MS = 1400;

function SeloCheck({ ativo }: { ativo: boolean }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white transition-colors duration-500"
      style={{ backgroundColor: ativo ? "white" : "transparent" }}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
        <path
          d="M5 13l4 4L19 7"
          stroke={ativo ? "#f60f9e" : "white"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-500"
        />
      </svg>
    </span>
  );
}

function ResultadoAnalise({ fase }: { fase: "aprovado" | "revisao" }) {
  const aprovado = fase === "aprovado";

  return (
    <div className="animate-in fade-in-0 zoom-in-95 flex w-80 flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-2xl duration-300">
      {aprovado ? (
        // SVG com animação própria (círculo pulsando + check se
        // desenhando); next/image rasterizaria/otimizaria e quebraria a
        // animação.
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/success/cadastro-aprovado.svg" alt="" aria-hidden="true" className="size-20" />
      ) : (
        <div className="bg-warning/15 flex h-14 w-14 items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="#d97706"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
            />
          </svg>
        </div>
      )}
      <p className={`text-base font-semibold ${aprovado ? "text-success" : "text-warning"}`}>
        {aprovado ? "Cadastro aprovado" : "Cadastro enviado para análise"}
      </p>
      <p className="text-muted-foreground text-sm">
        {aprovado
          ? "Seu cadastro foi aprovado, um link com o contrato foi enviado para o e-mail dos sócios cadastrados."
          : "Seu cadastro precisou de uma análise mais aprofundada, em breve nossa equipe entrará em contato para mais informações. Fique ligado!"}
      </p>

      {!aprovado ? (
        <>
          <p className="text-muted-foreground text-sm">
            Ficou com alguma dúvida? Fale com um de nossos atendentes pelo WhatsApp.
          </p>
          <a
            href={WHATSAPP_LINK_ATENDIMENTO}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-success hover:bg-success/90 flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            <WhatsAppIcon className="size-4" />
            Falar no WhatsApp
          </a>
        </>
      ) : null}
    </div>
  );
}

// Tela cheia exibida entre o clique em "Enviar Cadastro" e o resultado
// final: enquanto a análise roda de verdade no servidor (reconsulta QSA,
// análise de documentos pela IA, geração do contrato), mostra a lista de
// frases girando com "check" progressivo, igual ao protótipo aprovado.
// Ao concluir, cruza pro cartão de resultado — aprovado ou revisão
// manual, nunca "reprovado": a IA de hoje só decide entre aprovar na
// hora ou mandar pra checagem humana, não existe rejeição automática.
// Renderizado em portal (mesmo motivo do RevisaoContratoModal: escapar
// de qualquer ancestral com transform que vire containing block de um
// elemento fixed).
export function AnaliseCadastroOverlay({ fase }: AnaliseCadastroOverlayProps) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const listaRef = useRef<HTMLUListElement | null>(null);
  const reduzMovimentoRef = useRef(false);

  useEffect(() => {
    reduzMovimentoRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (fase !== "analisando") return;

    const intervalo = setInterval(() => {
      setIndiceAtivo((atual) => (atual + 1) % FRASES.length);
    }, INTERVALO_FRASE_MS);

    return () => clearInterval(intervalo);
  }, [fase]);

  useEffect(() => {
    if (!listaRef.current) return;
    listaRef.current.style.transform = `translateY(${-indiceAtivo * ALTURA_LINHA}px)`;
  }, [indiceAtivo]);

  return createPortal(
    <div className="from-sakura-700 via-sakura-500 to-warning fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-tr px-4">
      {fase === "analisando" ? (
        <div className="flex flex-col items-center gap-10">
          <div
            className="relative h-[150px] w-[260px] overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
          >
            <ul
              ref={listaRef}
              className="m-0 list-none p-0 ease-in-out"
              style={{
                transitionProperty: "transform",
                transitionDuration: reduzMovimentoRef.current ? "0ms" : "700ms",
              }}
            >
              {FRASES.map((frase, indice) => {
                const ativo = indice <= indiceAtivo;
                return (
                  <li
                    key={frase}
                    className="flex items-center gap-3 text-lg text-white"
                    style={{ height: ALTURA_LINHA }}
                  >
                    <SeloCheck ativo={ativo} />
                    <span>
                      {frase}
                      {frase !== "Aguarde" ? "..." : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            <span className="text-sm font-medium">Analisando com IA</span>
          </div>
        </div>
      ) : (
        <ResultadoAnalise fase={fase} />
      )}
    </div>,
    document.body,
  );
}

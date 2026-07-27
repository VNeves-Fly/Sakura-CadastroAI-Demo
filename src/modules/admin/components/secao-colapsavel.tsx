"use client";

import { useRef, useState, type ReactNode } from "react";
import { animate } from "animejs";
import { ChevronDown } from "lucide-react";

const DURACAO_MS = 350;

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Tinta o bloco inteiro (borda esquerda + fundo bem leve) conforme um
// veredito — usado por AMAT/SOFIA pra sinalizar "tem pendência"
// (negativo) vs "limpo" (positivo) sem precisar abrir o card (ver
// ConsultaAmatCard/ConsultaSofiaCard). "neutro" (default) preserva o
// visual padrão do resto do dossiê.
type VarianteSecaoColapsavel = "neutro" | "positivo" | "negativo";

const CLASSES_VARIANTE: Record<VarianteSecaoColapsavel, string> = {
  neutro: "border-l-primary/60 bg-card",
  positivo: "border-l-success bg-success/5",
  negativo: "border-l-destructive bg-destructive/5",
};

interface SecaoColapsavelProps {
  titulo: string;
  // Elemento já renderizado (ex: <Building2 className="size-4" />), não o
  // componente em si — uma função de ícone não pode atravessar a fronteira
  // Server → Client Component como prop.
  icon: ReactNode;
  defaultAberta?: boolean;
  variante?: VarianteSecaoColapsavel;
  children: ReactNode;
}

// Seção colapsável do dossiê — anima altura/opacidade com Anime.js v4 ao
// abrir/fechar. O conteúdo fica sempre no DOM (só a altura é animada) pra
// não perder o scrollHeight na hora de medir a transição.
export function SecaoColapsavel({
  titulo,
  icon,
  defaultAberta = true,
  variante = "neutro",
  children,
}: SecaoColapsavelProps) {
  const [aberta, setAberta] = useState(defaultAberta);
  const [animando, setAnimando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  function alternar() {
    const el = conteudoRef.current;
    if (!el || animando) return;

    const vaiAbrir = !aberta;
    setAnimando(true);

    if (prefereMovimentoReduzido()) {
      setAberta(vaiAbrir);
      el.style.height = vaiAbrir ? "auto" : "0px";
      setAnimando(false);
      return;
    }

    if (vaiAbrir) {
      setAberta(true);
      const alturaFinal = el.scrollHeight;
      animate(el, {
        height: [0, alturaFinal],
        opacity: [0, 1],
        duration: DURACAO_MS,
        ease: "outCubic",
        onComplete: () => {
          el.style.height = "auto";
          setAnimando(false);
        },
      });
    } else {
      const alturaAtual = el.scrollHeight;
      animate(el, {
        height: [alturaAtual, 0],
        opacity: [1, 0],
        duration: DURACAO_MS,
        ease: "inCubic",
        onComplete: () => {
          setAberta(false);
          setAnimando(false);
        },
      });
    }
  }

  return (
    <section
      className={`border-border overflow-hidden rounded-2xl border border-l-4 ${CLASSES_VARIANTE[variante]}`}
    >
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberta}
        className="hover:bg-muted/40 flex w-full items-center justify-between gap-2 p-5 text-left transition-colors"
      >
        <span className="flex items-center gap-2 text-neutral-900">
          {icon}
          <span className="text-xs font-bold tracking-wide uppercase">{titulo}</span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-neutral-500 transition-transform duration-300 ${
            aberta ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        ref={conteudoRef}
        style={{ height: defaultAberta ? "auto" : "0px", opacity: defaultAberta ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5">{children}</div>
      </div>
    </section>
  );
}

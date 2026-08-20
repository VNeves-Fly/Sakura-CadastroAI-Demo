"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface StickyHorizontalScrollbarProps {
  // Ref pro container real com overflow-x-auto (ver <Table containerRef>).
  containerRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

// Tabelas largas (muitas colunas) com muitas linhas deixam a barra de
// rolagem horizontal nativa colada no rodapé da própria tabela — pra
// alcançá-la o analista precisa rolar a página inteira até o fim. Esta
// barra "espelho" fica fixa no rodapé da viewport, alinhada com a largura
// real da tabela, e só aparece quando faz sentido: há overflow horizontal
// E o rodapé da tabela (onde estaria a barra nativa) está fora da tela.
export function StickyHorizontalScrollbar({
  containerRef,
  className,
}: StickyHorizontalScrollbarProps) {
  const mirrorRef = useRef<HTMLDivElement>(null);
  // Evita ping-pong infinito entre os dois scroll handlers (mirror <-> real).
  const sincronizandoRef = useRef(false);
  const [posicao, setPosicao] = useState<{ left: number; width: number } | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recalcular() {
      const elemento = containerRef.current;
      if (!elemento) return;
      const caixa = elemento.getBoundingClientRect();
      const temOverflow = elemento.scrollWidth > elemento.clientWidth + 1;
      const rodapeForaDaTela = caixa.bottom > window.innerHeight;
      const algumaParteNaTela = caixa.top < window.innerHeight && caixa.bottom > 0;

      setPosicao({ left: caixa.left, width: caixa.width });
      setScrollWidth(elemento.scrollWidth);
      setVisivel(temOverflow && rodapeForaDaTela && algumaParteNaTela);
    }

    recalcular();

    const resizeObserver = new ResizeObserver(recalcular);
    resizeObserver.observe(container);

    // "scroll" não borbulha até a window, mas em captura o evento passa
    // pela cadeia de ancestrais até o alvo — pega o scroll do <main> do
    // layout admin (overflow-y-auto) sem precisar saber qual é.
    window.addEventListener("scroll", recalcular, { capture: true, passive: true });
    window.addEventListener("resize", recalcular);

    function aoRolarContainer() {
      if (sincronizandoRef.current) {
        sincronizandoRef.current = false;
        return;
      }
      if (mirrorRef.current) {
        sincronizandoRef.current = true;
        // container não é nulo aqui — checado antes do closure ser criado
        // (early return acima), só não fica claro pro narrowing do TS
        // dentro de function declaration.
        mirrorRef.current.scrollLeft = container!.scrollLeft;
      }
      recalcular();
    }
    container.addEventListener("scroll", aoRolarContainer, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", recalcular, { capture: true });
      window.removeEventListener("resize", recalcular);
      container.removeEventListener("scroll", aoRolarContainer);
    };
  }, [containerRef]);

  function aoRolarMirror() {
    if (sincronizandoRef.current) {
      sincronizandoRef.current = false;
      return;
    }
    const container = containerRef.current;
    if (container && mirrorRef.current) {
      sincronizandoRef.current = true;
      container.scrollLeft = mirrorRef.current.scrollLeft;
    }
  }

  if (!visivel || !posicao) return null;

  return (
    <div
      aria-hidden
      ref={mirrorRef}
      onScroll={aoRolarMirror}
      className={cn(
        "border-border bg-background/90 fixed bottom-0 z-40 h-3.5 overflow-x-auto overflow-y-hidden border-t backdrop-blur-sm",
        className,
      )}
      style={{ left: posicao.left, width: posicao.width }}
    >
      <div style={{ width: scrollWidth, height: 1 }} />
    </div>
  );
}

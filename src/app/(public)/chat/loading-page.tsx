"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

interface LoadingPageProps {
  onConcluir: () => void;
}

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Adaptado do "loading-page" (contador 0-100% + barra de progresso) —
// mesma ideia do design original, em Tailwind e React em vez de
// jQuery/setInterval solto no DOM. Ao concluir, dá um fade-out (Anime.js)
// antes de chamar onConcluir, pra criar uma transição suave até a tela
// de resultado em vez de um corte seco.
export function LoadingPage({ onConcluir }: LoadingPageProps) {
  const [porcentagem, setPorcentagem] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function finalizar() {
      const el = ref.current;
      if (!el || prefereMovimentoReduzido()) {
        onConcluir();
        return;
      }
      animate(el, { opacity: [1, 0], duration: 400, ease: "inCubic", onComplete: onConcluir });
    }

    if (prefereMovimentoReduzido()) {
      const id = setTimeout(finalizar, 800);
      return () => clearTimeout(id);
    }

    let atual = 0;
    const intervalo = setInterval(() => {
      atual += 1;
      setPorcentagem(atual);
      if (atual >= 100) {
        clearInterval(intervalo);
        setTimeout(finalizar, 400);
      }
    }, 50);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center bg-[#090d17]">
      <div className="w-[200px] text-center">
        <p className="text-primary text-3xl font-thin">analisando</p>
        <h1 className="-mt-2 text-5xl text-white">{porcentagem}%</h1>
        <hr className="bg-primary mt-3 h-px border-none" style={{ width: `${porcentagem}%` }} />
      </div>
    </div>
  );
}

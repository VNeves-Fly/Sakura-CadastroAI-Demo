"use client";

import { useEffect, useState } from "react";

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Tela cheia exibida enquanto o envio real roda no backend (ver
// executarEnvioReal em use-chat-script.ts). O componente não sabe
// quando o trabalho termina — fica visível só enquanto `fase ===
// "analisando"` no hook; o pai troca de tela sozinho assim que o
// resultado real chega. O contador 0-100% roda em loop (em vez de parar
// e disparar um callback) pra continuar parecendo "vivo" mesmo se a
// chamada real demorar mais que uma volta da animação.
export function LoadingPage() {
  const [porcentagem, setPorcentagem] = useState(0);
  const [reduzMovimento, setReduzMovimento] = useState(false);

  useEffect(() => {
    const reduz = prefereMovimentoReduzido();
    setReduzMovimento(reduz);
    if (reduz) return;

    let atual = 0;
    const intervalo = setInterval(() => {
      atual = (atual + 1) % 101;
      setPorcentagem(atual);
    }, 50);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090d17]">
      <div className="w-[200px] text-center">
        <p className="text-primary text-3xl font-thin">analisando</p>
        <h1 className="-mt-2 text-5xl text-white">{reduzMovimento ? "" : `${porcentagem}%`}</h1>
        <hr
          className="bg-primary mt-3 h-px border-none"
          style={{ width: reduzMovimento ? "100%" : `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface AnaliseDocumentoLoadingProps {
  visivel: boolean;
  mensagem?: string;
}

const DURACAO_TRANSICAO_MS = 250;

// Card pequeno e centralizado, com a tela toda escurecendo/desfocando
// atrás, mostrado enquanto um documento é analisado pela IA (contrato
// social, RG/CNH). Fica sempre montado — `visivel` que liga/desliga o
// fade + blur suave (em vez de aparecer/sumir de repente); só some do
// DOM de verdade depois que a transição de saída termina.
export function AnaliseDocumentoLoading({
  visivel,
  mensagem = "Analisando o documento...",
}: AnaliseDocumentoLoadingProps) {
  const [montado, setMontado] = useState(visivel);
  const [ativo, setAtivo] = useState(false);
  const [mensagemExibida, setMensagemExibida] = useState(mensagem);

  useEffect(() => {
    if (mensagem) setMensagemExibida(mensagem);
  }, [mensagem]);

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      const id = requestAnimationFrame(() => setAtivo(true));
      return () => cancelAnimationFrame(id);
    }

    setAtivo(false);
    const timeout = setTimeout(() => setMontado(false), DURACAO_TRANSICAO_MS);
    return () => clearTimeout(timeout);
  }, [visivel]);

  if (!montado) return null;

  return (
    <div
      className={`fixed inset-0 z-[65] flex items-center justify-center px-4 transition-all duration-[250ms] ${
        ativo
          ? "bg-black/80 opacity-100 backdrop-blur-sm"
          : "bg-black/0 opacity-0 backdrop-blur-none"
      }`}
    >
      <div
        className={`bg-card border-border flex w-full max-w-[220px] flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-2xl transition-all duration-[250ms] ${
          ativo ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG com
        animação SMIL própria; next/image exigiria dangerouslyAllowSVG e
        arrisca rasterizar/otimizar o arquivo, quebrando a animação. */}
        <img src="/loading/aviao-analisando.svg" alt="" aria-hidden="true" className="size-28" />
        <p className="text-foreground text-sm font-medium">{mensagemExibida}</p>
      </div>
    </div>
  );
}

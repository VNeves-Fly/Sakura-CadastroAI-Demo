"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SEGUNDOS_PARA_FECHAR = 5;

// Alerta disparado ao tentar "Validar Contrato" sem ter clicado em
// "Criar Travel Link" antes (ver ValidacaoSicaTravelLink) — some sozinho
// depois de 5s, sem precisar de clique pra fechar (decisão do usuário,
// 2026-07-27).
export function AlertaTravelLinkModal({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: () => void;
}) {
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_PARA_FECHAR);

  useEffect(() => {
    if (!aberto) return;

    setSegundosRestantes(SEGUNDOS_PARA_FECHAR);
    const intervalo = setInterval(() => {
      setSegundosRestantes((atual) => atual - 1);
    }, 1_000);

    return () => clearInterval(intervalo);
  }, [aberto]);

  useEffect(() => {
    if (aberto && segundosRestantes <= 0) onFechar();
  }, [aberto, segundosRestantes, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card relative flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center shadow-2xl">
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-3 right-3 rounded-full p-1 transition"
        >
          <X className="size-4" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element -- imagem estática em /public, sem otimização necessária */}
        <img src="/alerta/travel-link-pendente.png" alt="Atenção" className="size-16" />

        <p className="text-foreground text-sm font-semibold">
          Atenção, você precisa clicar na flag &ldquo;Criar Travel Link&rdquo; para seguir com o
          cadastro.
        </p>

        <span className="text-muted-foreground text-xs">Fechando em {segundosRestantes}s...</span>
      </div>
    </div>
  );
}

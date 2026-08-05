"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { CreatedGestorResult } from "@/modules/gestores/types/gestor.types";

interface GestorSuccessProps {
  result: CreatedGestorResult;
  onDismiss: () => void;
}

export function GestorSuccess({ result, onDismiss }: GestorSuccessProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!result.temporaryPassword) return;
    await navigator.clipboard.writeText(result.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-primary/30 bg-primary/5 relative flex flex-col gap-2 rounded-[1.5rem] border p-5">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar"
        className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition"
      >
        <X className="size-4" />
      </button>

      <p className="text-foreground pr-6 text-sm font-semibold">
        Gestor {result.gestor.nome} salvo com sucesso.
      </p>

      {result.temporaryPassword ? (
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-sm">
            Senha:{" "}
            <span className="text-foreground font-mono font-semibold">
              {result.temporaryPassword}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="border-input bg-background text-foreground hover:bg-muted flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copiado" : "Copiar senha"}
            </button>
            <p className="text-muted-foreground text-xs">
              Essa senha só aparece agora — anote antes de sair da tela.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

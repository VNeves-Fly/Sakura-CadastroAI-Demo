"use client";

import { X } from "lucide-react";
import type { NumeroContato } from "@/modules/atendimento/types/atendimento.types";
import type { ModalEscolhaContato } from "@/modules/atendimento/view-models/use-atendimento.view-model";

interface ModalEscolhaContatoViewProps {
  modal: ModalEscolhaContato | null;
  onEscolher: (numero: NumeroContato) => void;
  onFechar: () => void;
}

// Aparece ao chegar em /atendimento?agenciaId=X (botão "Atendimento" do
// dossiê) quando a agência tem mais de 1 número de WhatsApp — mesmo casco
// de modal já usado no dossiê (fixed + backdrop + bg-card rounded-2xl,
// ver ModalVerTudo em consulta-amat-sofia.tsx).
export function ModalEscolhaContato({ modal, onEscolher, onFechar }: ModalEscolhaContatoViewProps) {
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        className="bg-card flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3">
          <span className="text-foreground min-w-0 truncate text-sm font-semibold">
            Com quem você quer falar? — {modal.agenciaNome}
          </span>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="text-muted-foreground hover:bg-accent hover:text-foreground shrink-0 rounded-full p-1 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-3">
          {modal.numeros.map((numero) => (
            <button
              key={`${numero.papel}-${numero.telefone}`}
              type="button"
              onClick={() => onEscolher(numero)}
              className="border-border hover:bg-accent flex items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition"
            >
              <span className="text-foreground font-medium">{numero.label}</span>
              <span className="text-muted-foreground text-xs">{numero.telefone}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// `data` chega como string (não Date) quando vem de uma entidade de
// domínio com toJSON — ver formatarData em dossie-campos.util.ts.
function formatarDataHora(data: Date | string): string {
  return (data instanceof Date ? data : new Date(data)).toLocaleString("pt-BR");
}

interface TravelLinkSwitchProps {
  agenciaId: string;
  travelLinkCriado: boolean;
  travelLinkSalvoPor: string | null;
  travelLinkSalvoEm: Date | null;
  salvarTravelLinkAction: (agenciaId: string, criado: boolean) => Promise<void>;
  somenteLeitura?: boolean;
}

// Fora de qualquer acordeão (decisão do usuário, 2026-07-29 — antes vivia
// dentro do acordeão "TravelLink", junto com os dados da empresa). A
// flag grava o mesmo Agencia.travelLinkCriado de sempre, salvando direto
// ao ligar — decisão do usuário, 2026-07-27: nunca mais é possível
// desligar por aqui depois de criado.
export function TravelLinkSwitch({
  agenciaId,
  travelLinkCriado,
  travelLinkSalvoPor,
  travelLinkSalvoEm,
  salvarTravelLinkAction,
  somenteLeitura = false,
}: TravelLinkSwitchProps) {
  const [salvando, setSalvando] = useState(false);

  async function ativarFlag() {
    setSalvando(true);
    await salvarTravelLinkAction(agenciaId, true);
    setSalvando(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm font-medium">TravelLink criado</span>
        <button
          type="button"
          role="switch"
          aria-checked={travelLinkCriado}
          disabled={somenteLeitura || salvando || travelLinkCriado}
          onClick={() => void ativarFlag()}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed",
            travelLinkCriado ? "bg-success" : "bg-input",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform",
              travelLinkCriado ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {travelLinkCriado && travelLinkSalvoPor && travelLinkSalvoEm ? (
        <span className="text-success text-xs font-medium">
          ✓ Confirmado por {travelLinkSalvoPor} em {formatarDataHora(travelLinkSalvoEm)}
        </span>
      ) : null}
    </div>
  );
}

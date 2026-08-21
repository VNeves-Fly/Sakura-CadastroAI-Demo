"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GateBiometriaSwitchProps {
  agenciaId: string;
  ativo: boolean;
  definirGateBiometriaAction: (agenciaId: string, ativo: boolean) => Promise<void>;
  somenteLeitura?: boolean;
}

// Toggle admin/diretor (ver CARGOS_GATE_BIOMETRIA em actions.ts) do fluxo
// paralelo de biometria facial (Legitimuz) — ver docs/legitimuz/. Precisa
// ser decidido antes da aprovação (em_analise/em_complementar), já que
// gerarEEnviar lê esse valor na hora de montar o createlist/sendtosigner.
// Diferente de TravelLinkSwitch, é bidirecional (dá pra desligar de novo)
// — é só um piloto por agência, não um registro definitivo.
export function GateBiometriaSwitch({
  agenciaId,
  ativo,
  definirGateBiometriaAction,
  somenteLeitura = false,
}: GateBiometriaSwitchProps) {
  const [salvando, setSalvando] = useState(false);

  async function alternar() {
    setSalvando(true);
    await definirGateBiometriaAction(agenciaId, !ativo);
    setSalvando(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-foreground text-sm font-medium">
          Verificação de biometria facial (piloto)
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          disabled={somenteLeitura || salvando}
          onClick={() => void alternar()}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
            ativo ? "bg-success" : "bg-input",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 rounded-full bg-white shadow transition-transform",
              ativo ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
      <p className="text-muted-foreground text-xs">
        {ativo
          ? "Ligado — o sócio vai passar por biometria facial antes de assinar, sem selfie/vídeo pedidos pelo D4Sign."
          : "Desligado — fluxo padrão de assinatura (D4Sign notifica o sócio direto)."}
      </p>
    </div>
  );
}

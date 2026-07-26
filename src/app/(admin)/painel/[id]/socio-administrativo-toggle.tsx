"use client";

import { useState } from "react";
import { SwipeSwitch } from "./swipe-switch";

interface SocioAdministrativoToggleProps {
  agenciaId: string;
  representanteLegalId: string;
  administrativo: boolean | null;
  atualizarAdministrativoSocioAction: (
    agenciaId: string,
    representanteLegalId: string,
    administrativo: boolean | null,
  ) => Promise<void>;
  disabled?: boolean;
}

// null (IA ainda não avaliou) e true assinam o contrato — só false exclui
// o sócio da lista de signatarios (ver filtro em AnalisarCadastroUseCase/
// AprovarCadastroComplementarUseCase). O switch é binário: religar depois
// de desligado grava `true` (não volta a `null`).
export function SocioAdministrativoToggle({
  agenciaId,
  representanteLegalId,
  administrativo,
  atualizarAdministrativoSocioAction,
  disabled = false,
}: SocioAdministrativoToggleProps) {
  const [assina, setAssina] = useState(administrativo !== false);
  const [salvando, setSalvando] = useState(false);

  async function handleChange(checked: boolean) {
    setAssina(checked);
    setSalvando(true);
    await atualizarAdministrativoSocioAction(agenciaId, representanteLegalId, checked);
    setSalvando(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs font-medium">Assina o contrato</span>
      <SwipeSwitch
        id={`administrativo-${representanteLegalId}`}
        checked={assina}
        onChange={(checked) => void handleChange(checked)}
        disabled={disabled || salvando}
      />
    </div>
  );
}

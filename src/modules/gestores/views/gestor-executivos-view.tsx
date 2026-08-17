"use client";

import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorExecutivosTab } from "@/modules/gestores/components/gestor-executivos-tab";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";
import type { ExecutivoDaGestaoView } from "@/modules/gestores/types/gestor-executivos-tab.types";

interface GestorExecutivosViewProps {
  perfil: GestorPerfil;
  executivos: ExecutivoDaGestaoView[];
}

export function GestorExecutivosView({ perfil, executivos }: GestorExecutivosViewProps) {
  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="executivos">
      <GestorExecutivosTab executivos={executivos} />
    </GestorDetalheShell>
  );
}

"use client";

import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorAgendaTab } from "@/modules/gestores/components/gestor-agenda-tab";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgendaViewProps {
  perfil: GestorPerfil;
  executivos: ExecutivoComCarteira[];
}

export function GestorAgendaView({ perfil, executivos }: GestorAgendaViewProps) {
  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="agenda">
      <GestorAgendaTab executivos={executivos} />
    </GestorDetalheShell>
  );
}

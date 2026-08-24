"use client";

import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorAgenciasFiltrosToolbar } from "@/modules/gestores/components/gestor-agencias-filtros-toolbar";
import { GestorAgenciasTabela } from "@/modules/gestores/components/gestor-agencias-tabela";
import { useGestorAgenciasTabViewModel } from "@/modules/gestores/view-models/use-gestor-agencias-tab.view-model";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgenciasViewProps {
  perfil: GestorPerfil;
  executivos: ExecutivoComCarteira[];
  porExecutivo: Array<{ id: string; agenciasCarteira: AgenciaCarteiraResumo[] }>;
}

export function GestorAgenciasView({ perfil, executivos, porExecutivo }: GestorAgenciasViewProps) {
  const { filtros, atualizarFiltro, agencias, total, opcoesExecutivo } =
    useGestorAgenciasTabViewModel(executivos, porExecutivo);

  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="agencias">
      <GestorAgenciasFiltrosToolbar
        filtros={filtros}
        onAtualizarFiltro={atualizarFiltro}
        total={total}
        opcoesExecutivo={opcoesExecutivo}
      />

      <div className="border-border bg-card rounded-2xl border">
        <GestorAgenciasTabela agencias={agencias} periodo={filtros.periodo} />
      </div>
    </GestorDetalheShell>
  );
}

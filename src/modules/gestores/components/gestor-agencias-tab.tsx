"use client";

import { GestorAgenciasFiltrosToolbar } from "@/modules/gestores/components/gestor-agencias-filtros-toolbar";
import { GestorAgenciasTabela } from "@/modules/gestores/components/gestor-agencias-tabela";
import { useGestorAgenciasTabViewModel } from "@/modules/gestores/view-models/use-gestor-agencias-tab.view-model";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgenciasTabProps {
  executivos: ExecutivoComCarteira[];
  porExecutivo: Array<{ id: string; agenciasCarteira: AgenciaCarteiraResumo[] }>;
}

// Filtragem/ordenação local (useGestorAgenciasTabViewModel) — precisa de
// "use client", por isso separado de gestor-agencias-secao.tsx (o Server
// Component que resolve `agregadoPromise` antes de montar este componente).
export function GestorAgenciasTab({ executivos, porExecutivo }: GestorAgenciasTabProps) {
  const { filtros, atualizarFiltro, agencias, total, opcoesExecutivo } =
    useGestorAgenciasTabViewModel(executivos, porExecutivo);

  return (
    <>
      <GestorAgenciasFiltrosToolbar
        filtros={filtros}
        onAtualizarFiltro={atualizarFiltro}
        total={total}
        opcoesExecutivo={opcoesExecutivo}
      />

      <div className="border-border bg-card rounded-2xl border">
        <GestorAgenciasTabela agencias={agencias} periodo={filtros.periodo} />
      </div>
    </>
  );
}

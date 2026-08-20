"use client";

import type { ReactNode } from "react";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import { AgenciasFiltrosToolbar } from "@/modules/atribuicoes/components/executivo/agencias/agencias-filtros-toolbar";
import { AgenciasTabela } from "@/modules/atribuicoes/components/executivo/agencias/agencias-tabela";
import { useExecutivoAgenciasViewModel } from "@/modules/atribuicoes/view-models/use-executivo-agencias.view-model";
import type {
  ExecutivoPerfil,
  ExecutivoAgenciaResumo,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoAgenciasViewProps {
  perfil: ExecutivoPerfil;
  agenciasReais: ExecutivoAgenciaResumo[];
  // Elementos já resolvidos pelo Server Component pai (page.tsx) — este
  // componente é client só pelos filtros/tabela, nunca busca SST ele
  // mesmo (ver criarExecutivoHeaderStatsSlots).
  statsAgenciasSlot?: ReactNode;
  statsVendendo30dSlot?: ReactNode;
}

export function ExecutivoAgenciasView({
  perfil,
  agenciasReais,
  statsAgenciasSlot,
  statsVendendo30dSlot,
}: ExecutivoAgenciasViewProps) {
  const { filtros, atualizarFiltro, agencias, total } =
    useExecutivoAgenciasViewModel(agenciasReais);

  return (
    <div className="flex w-full flex-col gap-5">
      <h1 className="text-foreground text-xl font-semibold">Detalhes do Executivo</h1>
      <ExecutivoProfileHeader
        perfil={perfil}
        statsAgenciasSlot={statsAgenciasSlot}
        statsVendendo30dSlot={statsVendendo30dSlot}
      />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva="agencias" />

      <AgenciasFiltrosToolbar filtros={filtros} onAtualizarFiltro={atualizarFiltro} total={total} />

      <div className="border-border bg-card rounded-2xl border">
        <AgenciasTabela agencias={agencias} periodo={filtros.periodo} />
      </div>
    </div>
  );
}

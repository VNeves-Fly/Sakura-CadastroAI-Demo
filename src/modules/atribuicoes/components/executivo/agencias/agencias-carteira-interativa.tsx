"use client";

import { AgenciasFiltrosToolbar } from "@/modules/atribuicoes/components/executivo/agencias/agencias-filtros-toolbar";
import { AgenciasTabela } from "@/modules/atribuicoes/components/executivo/agencias/agencias-tabela";
import { useExecutivoAgenciasViewModel } from "@/modules/atribuicoes/view-models/use-executivo-agencias.view-model";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface AgenciasCarteiraInterativaProps {
  agenciasCarteira: AgenciaCarteiraResumo[];
}

// Filtros + tabela da carteira (SPEC 6.1/6.2) — extraído de
// executivo-agencias-view.tsx pra viver atrás do próprio Suspense (ver
// agencias-carteira-secao.tsx): header/tabs da página renderizam na hora,
// só esta parte espera o roster do SST resolver.
export function AgenciasCarteiraInterativa({ agenciasCarteira }: AgenciasCarteiraInterativaProps) {
  const { filtros, atualizarFiltro, agencias, total } =
    useExecutivoAgenciasViewModel(agenciasCarteira);

  return (
    <>
      <AgenciasFiltrosToolbar filtros={filtros} onAtualizarFiltro={atualizarFiltro} total={total} />

      <div className="border-border bg-card rounded-2xl border">
        <AgenciasTabela agencias={agencias} periodo={filtros.periodo} />
      </div>
    </>
  );
}

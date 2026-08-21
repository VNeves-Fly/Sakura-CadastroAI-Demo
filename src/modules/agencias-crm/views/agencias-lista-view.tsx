"use client";

import { AgenciasStatusTabs } from "@/modules/agencias-crm/components/agencias-status-tabs";
import { AgenciasToolbar } from "@/modules/agencias-crm/components/agencias-toolbar";
import { AgenciasCarteiraTabela } from "@/modules/agencias-crm/components/agencias-carteira-tabela";
import { AgenciasPaginacao } from "@/modules/agencias-crm/components/agencias-paginacao";
import { useAgenciasCarteiraViewModel } from "@/modules/agencias-crm/view-models/use-agencias-carteira.view-model";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasListaViewProps {
  agencias: AgenciaCarteiraView[];
  atualizadoEm: string;
}

// Página "Agências Sakura" (SPEC_AGENCIAS_SAKURA, pixel, 2026-08-21) —
// reestilização completa por cima da develop atual. O detalhe da agência
// deixou de ser modal e virou página própria em /crm/agencias/[id]
// (mesmo padrão de /crm/executivos/[id] e /crm/gestores/[id]), por isso
// esta view só cuida da listagem.
export function AgenciasListaView({ agencias, atualizadoEm }: AgenciasListaViewProps) {
  const {
    statusTab,
    mudarStatusTab,
    contadores,
    busca,
    atualizarBusca,
    topVendas,
    mudarTopVendas,
    agencias: agenciasDaPagina,
    total,
    pagina,
    totalPaginas,
    setPagina,
    tamanhoPagina,
    setTamanhoPagina,
  } = useAgenciasCarteiraViewModel(agencias);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-semibold">Agências Sakura</h1>
      </div>

      <AgenciasToolbar
        busca={busca}
        onBuscaChange={atualizarBusca}
        topVendas={topVendas}
        onTopVendasChange={mudarTopVendas}
        atualizadoEm={atualizadoEm}
      />

      <AgenciasStatusTabs statusTab={statusTab} onChange={mudarStatusTab} contadores={contadores} />

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <AgenciasCarteiraTabela
          agencias={agenciasDaPagina}
          offsetPagina={(pagina - 1) * tamanhoPagina}
        />
        <AgenciasPaginacao
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          onMudarPagina={setPagina}
          tamanhoPagina={tamanhoPagina}
          onMudarTamanhoPagina={setTamanhoPagina}
        />
      </div>
    </div>
  );
}

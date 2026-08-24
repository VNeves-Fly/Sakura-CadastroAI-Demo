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
    // Card único envolvendo título+toolbar+abas+tabela+paginação — mesmo
    // container visual de ListaAgenciasCard (/crm/novas-agencias), pedido do
    // usuário pra padronizar o estilo das duas listagens (2026-08-24).
    // Colunas/dados/funcionalidade da tabela e paginação inalterados.
    <div className="overflow-hidden rounded-2xl border border-[#ECECF4] bg-white shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
      <div className="flex items-center justify-between gap-3 px-[22px] pt-[18px] pb-3">
        <h1 className="text-[15px] font-bold tracking-[-0.01em] text-[#1A1A2E]">Agências Sakura</h1>
      </div>

      <div className="px-[22px] pb-[18px]">
        <AgenciasToolbar
          busca={busca}
          onBuscaChange={atualizarBusca}
          topVendas={topVendas}
          onTopVendasChange={mudarTopVendas}
          atualizadoEm={atualizadoEm}
        />
      </div>

      <div className="px-[22px]">
        <AgenciasStatusTabs
          statusTab={statusTab}
          onChange={mudarStatusTab}
          contadores={contadores}
        />
      </div>

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
  );
}

"use client";

import { useState } from "react";
import { AgenciasStatusTabs } from "@/modules/agencias-crm/components/agencias-status-tabs";
import { AgenciasToolbar } from "@/modules/agencias-crm/components/agencias-toolbar";
import { AgenciasFiltroPanel } from "@/modules/agencias-crm/components/agencias-filtro-panel";
import { AgenciasCarteiraTabela } from "@/modules/agencias-crm/components/agencias-carteira-tabela";
import { AgenciasPaginacao } from "@/modules/agencias-crm/components/agencias-paginacao";
import { AgenciaDetalheModal } from "@/modules/agencias-crm/components/detalhe/agencia-detalhe-modal";
import { useAgenciasCarteiraViewModel } from "@/modules/agencias-crm/view-models/use-agencias-carteira.view-model";
import { TAMANHO_PAGINA_AGENCIAS } from "@/modules/agencias-crm/types/agencia-carteira.types";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasListaViewProps {
  agencias: AgenciaCarteiraView[];
  atualizadoEm: string;
}

export function AgenciasListaView({ agencias, atualizadoEm }: AgenciasListaViewProps) {
  const [agenciaSelecionadaId, setAgenciaSelecionadaId] = useState<string | null>(null);
  const {
    statusTab,
    mudarStatusTab,
    contadores,
    filtros,
    atualizarFiltro,
    alternarOrdenacao,
    limparFiltros,
    quantidadeFiltrosAtivos,
    painelFiltrosAberto,
    setPainelFiltrosAberto,
    opcoesExecutivo,
    opcoesGestor,
    opcoesBase,
    opcoesRegiao,
    agencias: agenciasDaPagina,
    total,
    pagina,
    totalPaginas,
    setPagina,
  } = useAgenciasCarteiraViewModel(agencias);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-foreground text-xl font-semibold">Agências Sakura</h1>
      </div>

      <AgenciasToolbar
        busca={filtros.busca}
        onBuscaChange={(valor) => atualizarFiltro("busca", valor)}
        ordenarPor={filtros.ordenarPor}
        onTopVendasChange={(valor) => {
          atualizarFiltro("ordenarPor", valor);
          atualizarFiltro("ordenarDirecao", "desc");
        }}
        quantidadeFiltrosAtivos={quantidadeFiltrosAtivos}
        painelFiltrosAberto={painelFiltrosAberto}
        onTogglePainelFiltros={() => setPainelFiltrosAberto((atual) => !atual)}
        atualizadoEm={atualizadoEm}
      />

      <AgenciasStatusTabs statusTab={statusTab} onChange={mudarStatusTab} contadores={contadores} />

      {painelFiltrosAberto ? (
        <AgenciasFiltroPanel
          filtros={filtros}
          onAtualizarFiltro={atualizarFiltro}
          onLimpar={limparFiltros}
          opcoesExecutivo={opcoesExecutivo}
          opcoesGestor={opcoesGestor}
          opcoesBase={opcoesBase}
          opcoesRegiao={opcoesRegiao}
        />
      ) : null}

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <AgenciasCarteiraTabela
          agencias={agenciasDaPagina}
          statusTab={statusTab}
          ordenarPor={filtros.ordenarPor}
          ordenarDirecao={filtros.ordenarDirecao}
          onOrdenar={alternarOrdenacao}
          onAbrirDetalhe={(agenciaId) => setAgenciaSelecionadaId(agenciaId)}
          offsetPagina={(pagina - 1) * TAMANHO_PAGINA_AGENCIAS}
        />
        <AgenciasPaginacao
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          onMudarPagina={setPagina}
        />
      </div>

      <AgenciaDetalheModal
        agenciaId={agenciaSelecionadaId}
        onOpenChange={(open) => {
          if (!open) setAgenciaSelecionadaId(null);
        }}
      />
    </div>
  );
}

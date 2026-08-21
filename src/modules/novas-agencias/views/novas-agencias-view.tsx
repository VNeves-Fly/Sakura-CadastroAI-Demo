"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { FunilAtivacaoCard } from "@/modules/novas-agencias/components/funil-ativacao-card";
import { VolumeGeradoCard, TempoMedioCard } from "@/modules/novas-agencias/components/resumo-cards";
import { FiltroPeriodoDashboardPopover } from "@/modules/dashboard-vendas/components/ui/filtro-periodo-dashboard-popover";
import { ListaAgenciasCard } from "@/modules/novas-agencias/components/lista-agencias-card";
import type { NovasAgenciasData } from "@/modules/novas-agencias/types/novas-agencias.types";

interface NovasAgenciasViewProps {
  dados: NovasAgenciasData;
}

type FiltroKpi = "nunca" | "comprando" | null;

// View única desta página — 100% client, estado local (SPEC seção 10:
// listaAberta/filtro/periodoAberto). Reproduz só a camada visual da SPEC
// recebida em 2026-08-21 (substitui a versão anterior de 2026-08-18 — ver
// services/novas-agencias.mock-service.ts pra origem dos dados).
export function NovasAgenciasView({ dados }: NovasAgenciasViewProps) {
  const [filtro, setFiltro] = useState<FiltroKpi>(null);
  const [listaAberta, setListaAberta] = useState(true);

  const agenciasFiltradas =
    filtro === "nunca"
      ? dados.agencias.filter((a) => a.situacao === "nunca" || a.situacao === "logou")
      : filtro === "comprando"
        ? dados.agencias.filter((a) => a.situacao === "comprando")
        : dados.agencias;

  // Toggle: reclicar no mesmo filtro limpa. Selecionar um filtro sempre
  // reabre a lista (SPEC 10.2), mesmo que o usuário tenha fechado antes.
  function alternarFiltro(novoFiltro: "nunca" | "comprando") {
    setFiltro((atual) => (atual === novoFiltro ? null : novoFiltro));
    setListaAberta(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#1A1A2E]">
            Análise de Novas Agências
          </h1>
          <p className="max-w-[62ch] text-sm text-[#6B6B85]">
            Ativação, primeiro acesso e primeira compra das agências aprovadas nos últimos 90 dias.
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#8888AA]">
            <span className="bg-primary inline-block size-1.5 rounded-full" />
            <span>{dados.sincronizacao.ultimaEm}</span>
            <span>·</span>
            <span>{dados.sincronizacao.distancia}</span>
            <span>·</span>
            <span>próx. {dados.sincronizacao.proximaEm}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8888AA]">
            <Eye className="size-3.5" strokeWidth={2} />
            <span>21/08/2026, 11:32</span>
          </div>
          <FiltroPeriodoDashboardPopover />
        </div>
      </div>

      <FunilAtivacaoCard funil={dados.funil} filtro={filtro} onFiltrar={alternarFiltro} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VolumeGeradoCard valor={dados.volumeGerado} />
        <TempoMedioCard dias={dados.tempoMedioPrimeiraCompraDias} />
      </div>

      <ListaAgenciasCard
        agencias={agenciasFiltradas}
        totalAgencias={dados.totalAgencias}
        filtro={filtro}
        onLimparFiltro={() => setFiltro(null)}
        aberta={listaAberta}
        onToggleAberta={() => setListaAberta((atual) => !atual)}
      />
    </div>
  );
}

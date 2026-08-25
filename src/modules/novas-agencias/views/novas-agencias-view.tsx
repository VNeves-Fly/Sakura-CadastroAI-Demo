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
  // Pré-formatado pela Server Component (page.tsx) — evita mismatch de
  // hidratação de usar `new Date()` direto num client component.
  carregadoEm: string;
}

type FiltroKpi = "nunca" | "comprando" | null;

// View única desta página — 100% client, estado local (listaAberta/filtro).
export function NovasAgenciasView({ dados, carregadoEm }: NovasAgenciasViewProps) {
  const [filtro, setFiltro] = useState<FiltroKpi>(null);
  const [listaAberta, setListaAberta] = useState(true);

  const agenciasFiltradas =
    filtro === "nunca"
      ? dados.agencias.filter((a) => a.situacao === "nunca")
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
            Ativação e primeira compra das agências aprovadas nos últimos 90 dias.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#8888AA]">
            <Eye className="size-3.5" strokeWidth={2} />
            <span>{carregadoEm}</span>
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
        totalAgencias={dados.agencias.length}
        filtro={filtro}
        onLimparFiltro={() => setFiltro(null)}
        aberta={listaAberta}
        onToggleAberta={() => setListaAberta((atual) => !atual)}
      />
    </div>
  );
}

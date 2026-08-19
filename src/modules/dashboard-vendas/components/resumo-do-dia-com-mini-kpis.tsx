"use client";

import { useState } from "react";
import {
  ResumoDoDiaCard,
  PERIODO_PREVIA_PERSONALIZADO,
  type FiltroResumo,
} from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
import type {
  MiniKpis,
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaComMiniKpisProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
  miniKpisPorPeriodo: Record<PeriodoResumo, MiniKpis>;
}

// Dono do estado de período (Hoje/Ontem/Este mês/Este ano/Personalizado)
// — antes vivia só dentro de ResumoDoDiaCard, então os mini-KPIs de baixo
// (Clientes/Bilhetes/Ticket Médio) nunca acompanhavam o filtro (corrigido
// 2026-08-19). Precisou subir pra este wrapper porque
// ResumoDoDiaSecao (quem os renderizava direto) é Server Component, não
// pode ter state.
export function ResumoDoDiaComMiniKpis({
  resumoPorPeriodo,
  miniKpisPorPeriodo,
}: ResumoDoDiaComMiniKpisProps) {
  const [filtro, setFiltro] = useState<FiltroResumo>("hoje");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const periodoComDados: PeriodoResumo =
    filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO : filtro;

  return (
    <>
      <ResumoDoDiaCard
        resumoPorPeriodo={resumoPorPeriodo}
        filtro={filtro}
        onFiltroChange={setFiltro}
        dataInicial={dataInicial}
        onDataInicialChange={setDataInicial}
        dataFinal={dataFinal}
        onDataFinalChange={setDataFinal}
      />
      <MiniKpisGrid {...miniKpisPorPeriodo[periodoComDados]} />
    </>
  );
}

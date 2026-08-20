"use client";

import { ResumoDoDiaCard } from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
import {
  useFiltroPeriodoDashboardStore,
  resolverPeriodo,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";
import type {
  MiniKpis,
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaComMiniKpisProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
  miniKpisPorPeriodo: Record<PeriodoResumo, MiniKpis>;
}

// Wrapper client só pra ler o período da store global (`ResumoDoDiaCard`
// já lê a mesma store direto pra si mesmo) e escolher o `MiniKpis` certo
// pra baixo — o filtro em si não é mais dono de nada aqui (levantado pra
// store em 2026-08-20, ver filtro-periodo-dashboard.store.ts; antes disso
// era o próprio state local deste componente, ver histórico do
// diagnóstico de 2026-08-19 no mesmo arquivo).
export function ResumoDoDiaComMiniKpis({
  resumoPorPeriodo,
  miniKpisPorPeriodo,
}: ResumoDoDiaComMiniKpisProps) {
  const filtro = useFiltroPeriodoDashboardStore((estado) => estado.filtro);
  const periodoComDados = resolverPeriodo(filtro);

  return (
    <>
      <ResumoDoDiaCard resumoPorPeriodo={resumoPorPeriodo} />
      <MiniKpisGrid {...miniKpisPorPeriodo[periodoComDados]} />
    </>
  );
}

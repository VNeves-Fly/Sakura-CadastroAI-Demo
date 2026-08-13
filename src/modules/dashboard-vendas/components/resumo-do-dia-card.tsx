"use client";

import { useState } from "react";
import { Bus, Clock, Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { ComparisonSplitCard } from "@/modules/dashboard-vendas/components/ui/comparison-split-card";
import { formatarAtualizadoEm } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import {
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type {
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const OPCOES_PERIODO: { valor: PeriodoResumo; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Este mês" },
  { valor: "ano", label: "Este ano" },
];

interface ResumoDoDiaCardProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
}

// 4.1 — KPI principal do topo, seletor de período e o par Aéreo/Terrestre
// com a barra de proporção. Todo o toggle é local/client-side: os 4
// cenários já vêm calculados na fixture, sem refetch.
export function ResumoDoDiaCard({ resumoPorPeriodo }: ResumoDoDiaCardProps) {
  const [periodo, setPeriodo] = useState<PeriodoResumo>("hoje");
  const resumo = resumoPorPeriodo[periodo];
  const totalPeriodo = resumo.aereo.valor + resumo.terrestre.valor;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="bg-clip-text text-4xl font-black text-transparent sm:text-[42px]"
            style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
          >
            {formatarMoedaBrl(totalPeriodo)}
          </p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" />
            Atualizado em {formatarAtualizadoEm(resumo.atualizadoEm)}
          </p>
        </div>

        <PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />
      </div>

      <div className="mt-5">
        <ComparisonSplitCard
          progressoEsquerdaPct={resumo.aereo.participacaoPct}
          esquerda={{
            icon: Plane,
            cor: COR_ROSA,
            corFundoIcone: COR_ROSA_BG,
            label: "Aéreo",
            valor: formatarMoedaBrl(resumo.aereo.valor),
            legenda: `${resumo.aereo.quantidade} bilhetes`,
            badgeTopo: formatarPercentual(resumo.aereo.participacaoPct),
            badgeRodape: `MARGEM ${formatarPercentual(resumo.aereo.margemPct)}`,
          }}
          direita={{
            icon: Bus,
            cor: COR_AZUL,
            corFundoIcone: COR_AZUL_BG,
            label: "Terrestre",
            valor: formatarMoedaBrl(resumo.terrestre.valor),
            legenda: `${resumo.terrestre.quantidade} vendas`,
            badgeTopo: formatarPercentual(resumo.terrestre.participacaoPct),
            badgeRodape: `MARGEM ${formatarPercentual(resumo.terrestre.margemPct)}`,
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Globe2, MapPin } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { ComparisonSplitCard } from "@/modules/dashboard-vendas/components/ui/comparison-split-card";
import {
  formatarMoedaAbreviada,
  formatarNumero,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { NacionalInternacional } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const OPCOES_PERIODO: { valor: "mes" | "ano"; label: string }[] = [
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

interface NacionalInternacionalCardProps {
  nacionalInternacionalPorMes: Record<string, NacionalInternacional>;
}

// 4.10 — Nacional x Internacional, só vendas aéreas. Barra de proporção
// única (mesmo padrão do par Aéreo/Terrestre em ResumoDoDiaCard, pedido
// do usuário 2026-08-19 — antes era rosca/donut, depois linha): rosa =
// Nacional, azul = Internacional.
export function NacionalInternacionalCard({
  nacionalInternacionalPorMes,
}: NacionalInternacionalCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const dados = nacionalInternacionalPorMes[periodo];
  const total = dados ? dados.nacional.valor + dados.internacional.valor : 0;
  const nacionalPct = total > 0 && dados ? (dados.nacional.valor / total) * 100 : 0;

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Globe2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">Nacional vs Internacional</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">Apenas vendas aéreas</p>
          </div>
        </div>
        <PeriodToggle opcoes={OPCOES_PERIODO} valor={periodo} onChange={setPeriodo} />
      </div>

      {dados ? (
        <div className="mt-4">
          <ComparisonSplitCard
            progressoEsquerdaPct={nacionalPct}
            participacaoEsquerda={formatarPercentual(nacionalPct)}
            participacaoDireita={formatarPercentual(100 - nacionalPct)}
            esquerda={{
              icon: MapPin,
              cor: COR_ROSA,
              corFundoIcone: COR_ROSA_BG,
              label: "Nacional",
              valor: formatarMoedaAbreviada(dados.nacional.valor),
              legenda: `${formatarNumero(dados.nacional.bilhetes)} bilhetes`,
            }}
            direita={{
              icon: Globe2,
              cor: COR_AZUL,
              corFundoIcone: COR_AZUL_BG,
              label: "Internacional",
              valor: formatarMoedaAbreviada(dados.internacional.valor),
              legenda: `${formatarNumero(dados.internacional.bilhetes)} bilhetes`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

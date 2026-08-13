"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Globe2 } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { LegendaItem } from "@/modules/dashboard-vendas/components/ui/legenda-item";
import {
  formatarMoedaAbreviada,
  formatarNumero,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_ROSA,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { NacionalInternacional } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const OPCOES_PERIODO: { valor: "mes" | "ano"; label: string }[] = [
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

interface NacionalInternacionalCardProps {
  nacionalInternacionalPorMes: Record<string, NacionalInternacional>;
}

// 4.10 — rosca Nacional x Internacional, só vendas aéreas.
export function NacionalInternacionalCard({
  nacionalInternacionalPorMes,
}: NacionalInternacionalCardProps) {
  const [periodo, setPeriodo] = useState<"mes" | "ano">("mes");
  const dados = nacionalInternacionalPorMes[periodo];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Nacional", "Internacional"],
    colors: [COR_ROSA, COR_AZUL],
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (valor: number) => `${valor.toFixed(0)}%` },
    stroke: { width: 0 },
  };

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
        <>
          <Chart
            options={options}
            series={[dados.nacional.valor, dados.internacional.valor]}
            type="donut"
            height={220}
          />
          <div className="mt-2 flex flex-col gap-1.5">
            <LegendaItem
              cor={COR_ROSA}
              nome="Nacional"
              valor={`${formatarMoedaAbreviada(dados.nacional.valor)} · ${formatarNumero(dados.nacional.bilhetes)} bilhetes`}
            />
            <LegendaItem
              cor={COR_AZUL}
              nome="Internacional"
              valor={`${formatarMoedaAbreviada(dados.internacional.valor)} · ${formatarNumero(dados.internacional.bilhetes)} bilhetes`}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

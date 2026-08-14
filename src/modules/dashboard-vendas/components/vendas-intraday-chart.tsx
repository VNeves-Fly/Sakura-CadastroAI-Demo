"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BarChart2 } from "lucide-react";
import { ChartCard } from "@/modules/dashboard-vendas/components/ui/chart-card";
import { LegendaItem } from "@/modules/dashboard-vendas/components/ui/legenda-item";
import { formatarAtualizadoEm } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import { formatarMoedaBrl } from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { linhaTooltip, wrapperTooltip } from "@/modules/dashboard-vendas/utils/apex-tooltip.util";
import {
  COR_AMARELO,
  COR_ROSA,
  COR_ROXO,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { BucketIntraday } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface VendasIntradayChartProps {
  intraday: BucketIntraday[];
  atualizadoEm: Date;
}

function totalCanal(
  intraday: BucketIntraday[],
  canal: "nacional" | "internacional" | "terrestre",
): number {
  return intraday.reduce((acc, bucket) => acc + bucket[canal].valor, 0);
}

function ticketMedio(valor: number, qtd: number): string {
  return formatarMoedaBrl(qtd > 0 ? valor / qtd : 0);
}

// 4.3 — série de área suavizada por bucket de 15 min, com tooltip
// detalhado (valor + qtd + TM por canal, e o total do bucket).
export function VendasIntradayChart({ intraday, atualizadoEm }: VendasIntradayChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [COR_ROSA, COR_ROXO, COR_AMARELO],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: { categories: intraday.map((bucket) => bucket.horario) },
    yaxis: { labels: { formatter: (valor: number) => `${Math.round(valor / 1000)}k` } },
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const bucket = intraday[dataPointIndex]!;
        const totalValor =
          bucket.nacional.valor + bucket.internacional.valor + bucket.terrestre.valor;
        const totalQtd = bucket.nacional.qtd + bucket.internacional.qtd + bucket.terrestre.qtd;
        const linhas = [
          linhaTooltip(
            COR_ROSA,
            "Nacional",
            `${formatarMoedaBrl(bucket.nacional.valor)} · ${bucket.nacional.qtd} · TM ${ticketMedio(bucket.nacional.valor, bucket.nacional.qtd)}`,
          ),
          linhaTooltip(
            COR_ROXO,
            "Internacional",
            `${formatarMoedaBrl(bucket.internacional.valor)} · ${bucket.internacional.qtd} · TM ${ticketMedio(bucket.internacional.valor, bucket.internacional.qtd)}`,
          ),
          linhaTooltip(
            COR_AMARELO,
            "Terrestre",
            `${formatarMoedaBrl(bucket.terrestre.valor)} · ${bucket.terrestre.qtd} · TM ${ticketMedio(bucket.terrestre.valor, bucket.terrestre.qtd)}`,
          ),
        ].join("");
        const totalLinha = linhaTooltip(
          "#111827",
          "Total",
          `${formatarMoedaBrl(totalValor)} · ${totalQtd} · TM ${ticketMedio(totalValor, totalQtd)}`,
        );
        return wrapperTooltip(bucket.horario, linhas, totalLinha);
      },
    },
  };

  const series = [
    { name: "Aéreo Nacional", data: intraday.map((bucket) => bucket.nacional.valor) },
    { name: "Aéreo Internacional", data: intraday.map((bucket) => bucket.internacional.valor) },
    { name: "Terrestre", data: intraday.map((bucket) => bucket.terrestre.valor) },
  ];

  return (
    <ChartCard
      icon={BarChart2}
      titulo="Vendas Intraday (hoje – buckets de 15 min)"
      subtitulo={`Atualizado em ${formatarAtualizadoEm(atualizadoEm)}`}
      legenda={
        <div className="flex flex-wrap gap-4">
          <LegendaItem
            cor={COR_ROSA}
            nome="Aéreo Nacional"
            valor={formatarMoedaBrl(totalCanal(intraday, "nacional"))}
          />
          <LegendaItem
            cor={COR_ROXO}
            nome="Aéreo Internacional"
            valor={formatarMoedaBrl(totalCanal(intraday, "internacional"))}
          />
          <LegendaItem
            cor={COR_AMARELO}
            nome="Terrestre"
            valor={formatarMoedaBrl(totalCanal(intraday, "terrestre"))}
          />
        </div>
      }
    >
      <Chart options={options} series={series} type="area" height={280} />
    </ChartCard>
  );
}

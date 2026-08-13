"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Info, LineChart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartCard } from "@/modules/dashboard-vendas/components/ui/chart-card";
import { LegendaItem } from "@/modules/dashboard-vendas/components/ui/legenda-item";
import {
  formatarMoedaAbreviada,
  formatarMoedaBrl,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_AZUL,
  COR_ROSA,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { VendaDiaria } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface VendasDiariasChartProps {
  vendasDiarias: VendaDiaria[];
}

// 4.9 — últimos 30 dias, com linha pontilhada da média do período total
// (aéreo + terrestre) sobreposta às duas áreas.
export function VendasDiariasChart({ vendasDiarias }: VendasDiariasChartProps) {
  const media =
    vendasDiarias.reduce((acc, dia) => acc + dia.aereo + dia.terrestre, 0) /
    Math.max(1, vendasDiarias.length);

  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [COR_ROSA, COR_AZUL],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: { categories: vendasDiarias.map((dia) => dia.data), tickAmount: 10 },
    yaxis: { labels: { formatter: (valor: number) => `$ ${(valor / 1_000_000).toFixed(1)}M` } },
    tooltip: { y: { formatter: (valor: number) => formatarMoedaBrl(valor) } },
    annotations: {
      yaxis: [
        {
          y: media,
          borderColor: "#9CA3AF",
          strokeDashArray: 4,
          label: {
            text: `Média ${formatarMoedaAbreviada(media)}`,
            style: { background: "#9CA3AF", color: "#fff" },
          },
        },
      ],
    },
  };

  const series = [
    { name: "Aéreo", data: vendasDiarias.map((dia) => dia.aereo) },
    { name: "Terrestre", data: vendasDiarias.map((dia) => dia.terrestre) },
  ];

  return (
    <ChartCard
      icon={LineChart}
      titulo="Vendas Diárias (últimos 30 dias)"
      acoes={
        <Tooltip>
          <TooltipTrigger render={<button type="button" aria-label="Sobre este gráfico" />}>
            <Info className="text-muted-foreground size-3.5" />
          </TooltipTrigger>
          <TooltipContent>
            Soma diária de vendas aéreas e terrestres, com a média do período em destaque.
          </TooltipContent>
        </Tooltip>
      }
      legenda={
        <div className="flex flex-wrap gap-4">
          <LegendaItem cor={COR_ROSA} nome="Aéreo" />
          <LegendaItem cor={COR_AZUL} nome="Terrestre" />
        </div>
      }
    >
      <Chart options={options} series={series} type="area" height={280} />
    </ChartCard>
  );
}

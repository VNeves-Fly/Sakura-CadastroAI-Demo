"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { BarChart3 } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { LegendaItem } from "@/modules/dashboard-vendas/components/ui/legenda-item";
import {
  formatarMoedaAbreviada,
  formatarMoedaBrl,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { linhaTooltip, wrapperTooltip } from "@/modules/dashboard-vendas/utils/apex-tooltip.util";
import { anoAtual } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import {
  COR_AZUL,
  COR_ROSA,
  COR_VERDE,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { Canal, VendaMensal } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const OPCOES_CANAL: { valor: Canal; label: string }[] = [
  { valor: "ambos", label: "Aéreo + Terrestre" },
  { valor: "aereo", label: "Aéreo" },
  { valor: "terrestre", label: "Terrestre" },
];

interface VendasMensaisChartProps {
  vendasMensais: VendaMensal[];
}

// 4.8 — barras empilhadas do ano corrente, canal filtra os segmentos
// visíveis (Aéreo Nacional/Internacional, Terrestre).
export function VendasMensaisChart({ vendasMensais }: VendasMensaisChartProps) {
  const [canal, setCanal] = useState<Canal>("ambos");

  const totalNacional = vendasMensais.reduce((acc, mes) => acc + mes.aereoNacional, 0);
  const totalInternacional = vendasMensais.reduce((acc, mes) => acc + mes.aereoInternacional, 0);
  const totalTerrestre = vendasMensais.reduce((acc, mes) => acc + mes.terrestre, 0);
  const totalAno = totalNacional + totalInternacional + totalTerrestre;

  const { pctAlta, pctBaixa } = useMemo(() => {
    const totaisPorMes = vendasMensais.map(
      (mes) => mes.aereoNacional + mes.aereoInternacional + mes.terrestre,
    );
    let altas = 0;
    let baixas = 0;
    for (let i = 1; i < totaisPorMes.length; i++) {
      if (totaisPorMes[i]! >= totaisPorMes[i - 1]!) altas++;
      else baixas++;
    }
    const totalComparacoes = Math.max(1, totaisPorMes.length - 1);
    return {
      pctAlta: (altas / totalComparacoes) * 100,
      pctBaixa: (baixas / totalComparacoes) * 100,
    };
  }, [vendasMensais]);

  const seriesTodas = [
    { key: "aereoNacional" as const, name: "Aéreo Nacional", cor: COR_ROSA },
    { key: "aereoInternacional" as const, name: "Aéreo Internacional", cor: COR_AZUL },
    { key: "terrestre" as const, name: "Terrestre", cor: COR_VERDE },
  ];
  const seriesVisiveis = seriesTodas.filter((serie) => {
    if (canal === "aereo") return serie.key !== "terrestre";
    if (canal === "terrestre") return serie.key === "terrestre";
    return true;
  });

  const options: ApexOptions = {
    chart: { type: "bar", stacked: true, fontFamily: "inherit", toolbar: { show: false } },
    colors: seriesVisiveis.map((serie) => serie.cor),
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 3 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: { categories: vendasMensais.map((mes) => mes.mes) },
    yaxis: { labels: { formatter: (valor: number) => formatarMoedaAbreviada(valor) } },
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const mes = vendasMensais[dataPointIndex]!;
        const linhas = seriesVisiveis
          .map((serie) => linhaTooltip(serie.cor, serie.name, formatarMoedaBrl(mes[serie.key])))
          .join("");
        const total = seriesVisiveis.reduce((acc, serie) => acc + mes[serie.key], 0);
        return wrapperTooltip(
          mes.mes,
          linhas,
          linhaTooltip("#111827", "Total", formatarMoedaBrl(total)),
        );
      },
    },
  };

  const series = seriesVisiveis.map((serie) => ({
    name: serie.name,
    data: vendasMensais.map((mes) => mes[serie.key]),
  }));

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <BarChart3 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">Vendas mensais por modalidade</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Ano {anoAtual()} · passe o mouse nas barras para ver detalhes
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Total {anoAtual()}
            </p>
            <p className="text-foreground text-lg font-bold">
              {formatarMoedaAbreviada(totalAno)}{" "}
              <span className="text-success text-xs font-semibold">▲ {pctAlta.toFixed(0)}%</span>{" "}
              <span className="text-destructive text-xs font-semibold">
                ▼ {pctBaixa.toFixed(0)}%
              </span>
            </p>
          </div>
          <PeriodToggle opcoes={OPCOES_CANAL} valor={canal} onChange={setCanal} />
        </div>
      </div>

      <div className="mt-4">
        <Chart options={options} series={series} type="bar" height={280} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <LegendaItem
          cor={COR_ROSA}
          nome="Aéreo Nacional"
          valor={formatarMoedaAbreviada(totalNacional)}
        />
        <LegendaItem
          cor={COR_AZUL}
          nome="Aéreo Internacional"
          valor={formatarMoedaAbreviada(totalInternacional)}
        />
        <LegendaItem
          cor={COR_VERDE}
          nome="Terrestre"
          valor={formatarMoedaAbreviada(totalTerrestre)}
        />
      </div>
    </div>
  );
}

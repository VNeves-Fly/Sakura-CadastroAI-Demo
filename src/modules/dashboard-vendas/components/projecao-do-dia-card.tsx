"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { Info, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MockBadge } from "@/modules/dashboard-vendas/components/ui/mock-badge";
import {
  formatarMoedaAbreviada,
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import {
  COR_CINZA,
  COR_ROSA,
  COR_ROXO,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type { ProjecaoDia } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ProjecaoDoDiaCardProps {
  projecao: ProjecaoDia;
}

// 4.4 — fechamento esperado do dia + faixa de confiança, realizado x a
// emitir, breakdown Nacional/Internacional e a curva projetada.
export function ProjecaoDoDiaCard({ projecao }: ProjecaoDoDiaCardProps) {
  const posicaoNaFaixa = Math.min(
    100,
    Math.max(
      0,
      ((projecao.fechamentoEsperado - projecao.faixaMin) /
        (projecao.faixaMax - projecao.faixaMin)) *
        100,
    ),
  );

  const options: ApexOptions = {
    chart: {
      type: "line",
      fontFamily: "inherit",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [COR_CINZA, COR_ROXO, COR_ROSA],
    stroke: { curve: "straight", width: 2, dashArray: [4, 0, 0] },
    dataLabels: { enabled: false },
    legend: { show: false },
    markers: { size: 0 },
    xaxis: { categories: projecao.curva.map((ponto) => ponto.hora) },
    yaxis: { labels: { formatter: (valor: number) => `${(valor / 1_000_000).toFixed(1)}M` } },
    tooltip: {
      y: { formatter: (valor: number | null) => (valor === null ? "—" : formatarMoedaBrl(valor)) },
    },
  };

  const series = [
    { name: "Curva esperada", data: projecao.curva.map((ponto) => ponto.esperado) },
    { name: "Nacional (hoje)", data: projecao.curva.map((ponto) => ponto.nacionalHoje) },
    { name: "Internacional (hoje)", data: projecao.curva.map((ponto) => ponto.internacionalHoje) },
  ];

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-muted-foreground size-4 shrink-0" />
          <h2 className="text-foreground text-sm font-semibold">Projeção do dia</h2>
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
            Histórico do dia da semana
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition"
          >
            <SlidersHorizontal className="size-3.5" />
            Parâmetros
          </button>
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" aria-label="Como a projeção é calculada" />}
            >
              <Info className="text-muted-foreground size-3.5" />
            </TooltipTrigger>
            <TooltipContent>
              Projeção baseada no histórico do mesmo dia da semana nas últimas semanas, ajustada
              pelo ritmo de vendas de hoje.
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          às {projecao.atualizadoEm.getHours().toString().padStart(2, "0")}:
          {projecao.atualizadoEm.getMinutes().toString().padStart(2, "0")} ·{" "}
          {formatarPercentual(projecao.percentualDiaTranscorrido)} do dia
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-foreground text-3xl font-black sm:text-4xl">
              {formatarMoedaAbreviada(projecao.fechamentoEsperado)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Faixa {formatarMoedaAbreviada(projecao.faixaMin)} —{" "}
              {formatarMoedaAbreviada(projecao.faixaMax)}
            </p>
            <div className="bg-muted relative mt-2 h-1.5 w-full rounded-full">
              <span
                className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${posicaoNaFaixa}%`, backgroundColor: COR_ROSA }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Realizado
              </p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {formatarMoedaAbreviada(projecao.realizado)}
              </p>
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                A emitir
              </p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {formatarMoedaAbreviada(projecao.aEmitir)}
              </p>
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <span className="size-2 rounded-full" style={{ backgroundColor: COR_ROXO }} />
                Nacional
              </p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {formatarMoedaAbreviada(projecao.nacional.projecao)}
              </p>
              <p className="text-muted-foreground text-xs">
                Realizado {formatarMoedaBrl(projecao.nacional.realizado)}
              </p>
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <span className="size-2 rounded-full" style={{ backgroundColor: COR_ROSA }} />
                Internacional
              </p>
              <p className="text-foreground mt-1 text-lg font-bold">
                {formatarMoedaAbreviada(projecao.internacional.projecao)}
              </p>
              <p className="text-muted-foreground text-xs">
                Realizado {formatarMoedaBrl(projecao.internacional.realizado)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-muted-foreground text-xs">Curva ilustrativa</span>
            <MockBadge />
          </div>
          <Chart options={options} series={series} type="line" height={280} />
        </div>
      </div>
    </div>
  );
}

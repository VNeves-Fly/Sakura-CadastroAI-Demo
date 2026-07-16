"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface GraficoContratosPorDiaProps {
  porDia: Array<{ dia: string; assinados: number; pendentes: number }>;
}

// Barras empilhadas — fluxo de quantos contratos entraram por dia,
// separando quantos já foram assinados dos que ainda estão pendentes.
// Dado real de Contrato.createdAt/status, mesmo estilo do "Revenue
// Analytics" do mapa-redesign-sakura.html, mas com a métrica que temos
// de verdade no domínio (contratos, não receita).
export function GraficoContratosPorDia({ porDia }: GraficoContratosPorDiaProps) {
  const options: ApexOptions = {
    chart: { type: "bar", stacked: true, fontFamily: "inherit", toolbar: { show: false } },
    xaxis: { categories: porDia.map((item) => item.dia) },
    colors: ["#22c55e", "#f60f9e"],
    legend: { position: "top" },
    plotOptions: { bar: { columnWidth: "55%", borderRadius: 3 } },
    dataLabels: { enabled: false },
    noData: { text: "Sem contratos no período" },
  };

  const series = [
    { name: "Assinados", data: porDia.map((item) => item.assinados) },
    { name: "Pendentes", data: porDia.map((item) => item.pendentes) },
  ];

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        Contratos por Dia
      </h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Quantos contratos entraram por dia, já assinados ou ainda aguardando assinatura dos sócios.
      </p>
      <div className="mt-2">
        <Chart options={options} series={series} type="bar" height={260} />
      </div>
    </div>
  );
}

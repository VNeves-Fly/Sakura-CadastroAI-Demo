"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface GraficoOrigemContratoProps {
  ia: number;
  humano: number;
}

// Rosca comparando quantos contratos foram gerados automaticamente pela
// IA (cadastro aprovado direto) vs gerados manualmente pelo analista
// (depois de uma revisão em Complementar) — dado real de
// Contrato.signatarios, sem estimativa.
export function GraficoOrigemContrato({ ia, humano }: GraficoOrigemContratoProps) {
  const total = ia + humano;

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Gerado pela IA", "Gerado pelo analista"],
    colors: ["#f60f9e", "#6366f1"],
    legend: { position: "bottom" },
    dataLabels: { enabled: total > 0 },
    noData: { text: "Sem contratos no período" },
  };

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h2 className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        IA x Atendimento Humano
      </h2>
      <p className="text-muted-foreground mt-1 text-xs">
        Origem dos contratos gerados — quantos a IA aprovou direto vs quantos precisaram de revisão
        manual do analista.
      </p>
      <div className="mt-2">
        <Chart options={options} series={[ia, humano]} type="donut" height={260} />
      </div>
    </div>
  );
}

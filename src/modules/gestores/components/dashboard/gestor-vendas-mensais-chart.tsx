"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  COR_AEREO_INTERNACIONAL,
  COR_AEREO_NACIONAL,
  COR_TERRESTRE,
} from "@/modules/gestores/constants/gestor-dashboard.constants";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type { VendaMensal } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorVendasMensaisChartProps {
  dados: VendaMensal[];
  totalAno: number;
  nacionalPct: number;
  internacionalPct: number;
  ano: number;
}

const LABELS_SERIE = {
  nacional: "Aéreo Nacional",
  internacional: "Aéreo Internacional",
  terrestre: "Terrestre",
};

function TooltipMes({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border-border bg-popover rounded-lg border p-3 text-xs shadow-md">
      <p className="text-foreground mb-1.5 font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: item.color }} />
            {LABELS_SERIE[item.dataKey as keyof typeof LABELS_SERIE]}
          </span>
          <span className="text-foreground font-medium">{formatarMoedaAbreviada(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Barra empilhada Nacional/Internacional/Terrestre — todos os valores são
// mock (derivados de hash do gestor ID); apenas as datas (meses do ano
// corrente) são reais. Mesmo componente do dashboard de Executivo, com o
// header trocado pra mostrar a proporção Nacional × Internacional em vez de
// duas variações lado a lado (SPEC pedida pelo usuário, 2026-08-17).
export function GestorVendasMensaisChart({
  dados,
  totalAno,
  nacionalPct,
  internacionalPct,
  ano,
}: GestorVendasMensaisChartProps) {
  const totais = dados.reduce(
    (acc, mes) => ({
      nacional: acc.nacional + mes.nacional,
      internacional: acc.internacional + mes.internacional,
      terrestre: acc.terrestre + mes.terrestre,
    }),
    { nacional: 0, internacional: 0, terrestre: 0 },
  );

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-sm font-semibold">
              Vendas mensais — Nacional vs Internacional
            </h3>
            <MockBadge />
          </div>
          <p className="text-muted-foreground text-xs">Ano {ano} · valores consolidados por mês</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Total {ano}
          </p>
          <p className="text-foreground text-lg font-bold">
            <SensitiveValue value={formatarMoedaAbreviada(totalAno)} />
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Nacional {nacionalPct}% · Internacional {internacionalPct}%
          </p>
        </div>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ left: -16 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="mes"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(valor: number) => formatarMoedaAbreviada(valor)}
              width={64}
            />
            <Tooltip content={<TooltipMes />} cursor={{ fill: "hsl(var(--muted))" }} />
            <Bar
              dataKey="nacional"
              stackId="vendas"
              fill={COR_AEREO_NACIONAL}
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="internacional" stackId="vendas" fill={COR_AEREO_INTERNACIONAL} />
            <Bar dataKey="terrestre" stackId="vendas" fill={COR_TERRESTRE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border-border mt-3 flex flex-wrap gap-5 border-t pt-3 text-xs">
        <LegendaItem cor={COR_AEREO_NACIONAL} label="Aéreo Nacional" valor={totais.nacional} />
        <LegendaItem
          cor={COR_AEREO_INTERNACIONAL}
          label="Aéreo Internacional"
          valor={totais.internacional}
        />
        <LegendaItem cor={COR_TERRESTRE} label="Terrestre" valor={totais.terrestre} />
      </div>
    </div>
  );
}

function LegendaItem({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: cor }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">
        <SensitiveValue value={formatarMoedaAbreviada(valor)} />
      </span>
    </span>
  );
}

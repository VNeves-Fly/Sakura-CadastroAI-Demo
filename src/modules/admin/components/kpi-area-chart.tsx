"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface KpiAreaChartProps {
  dados: { periodo: string; quantidade: number }[];
  cor: string;
  // Colapsado: só a área, sem eixos, ocupando o espaço mínimo ao lado do
  // valor. Expandido: eixos X/Y visíveis (ver DashboardKpiCard) — mesmo
  // componente, sem remount, só JSX condicional.
  expandido: boolean;
}

export function KpiAreaChart({ dados, cor, expandido }: KpiAreaChartProps) {
  const gradientId = useId();
  // Evita o eixo Y colapsar num domínio [0,0] quando a série está toda
  // zerada (nenhuma movimentação no período) — sem isso a área fica
  // desenhada como uma linha reta arbitrária no meio do gráfico.
  const maxValor = Math.max(1, ...dados.map((item) => item.quantidade));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={dados}
        margin={
          expandido
            ? { top: 8, right: 12, left: 0, bottom: 0 }
            : { top: 2, right: 2, left: 2, bottom: 2 }
        }
      >
        <defs>
          <linearGradient id={`kpi-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={cor} stopOpacity={0.35} />
            <stop offset="95%" stopColor={cor} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {expandido && (
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        )}
        {expandido && (
          <XAxis
            dataKey="periodo"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
        )}
        {expandido && (
          <YAxis
            allowDecimals={false}
            domain={[0, maxValor]}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          />
        )}
        <Tooltip content={<KpiChartTooltip />} cursor={{ stroke: cor, strokeOpacity: 0.25 }} />
        <Area
          type="monotone"
          dataKey="quantidade"
          stroke={cor}
          strokeWidth={2}
          fill={`url(#kpi-area-${gradientId})`}
          dot={expandido}
          activeDot={{ r: 4 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function KpiChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-popover text-popover-foreground rounded-lg border px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-bold">{payload[0]?.value}</p>
    </div>
  );
}

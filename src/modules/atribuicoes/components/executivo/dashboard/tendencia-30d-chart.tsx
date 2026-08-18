"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";

interface Tendencia30dChartProps {
  valores: number[];
  total: number;
}

// SparklineBarChart (SPEC 4.6) — 30 barras (1/dia), sem eixo visível.
// Todos os valores são mock (derivados de hash do promotor ID).
export function Tendencia30dChart({ valores, total }: Tendencia30dChartProps) {
  const dados = valores.map((valor, indice) => ({ dia: indice + 1, valor }));

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground text-sm font-semibold">Tendência últimos 30 dias</h3>
          <MockBadge />
        </div>
        <p className="text-muted-foreground text-xs">
          Total: <SensitiveValue value={formatarMoedaAbreviada(total)} />
        </p>
      </div>

      <div className="mt-3 h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados}>
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                if (!item) return null;
                return (
                  <div className="border-border bg-popover rounded-md border px-2 py-1 text-xs shadow-md">
                    Dia {item.payload.dia}: {formatarMoedaAbreviada(item.value as number)}
                  </div>
                );
              }}
            />
            <Bar dataKey="valor" fill="hsl(var(--chart-5))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

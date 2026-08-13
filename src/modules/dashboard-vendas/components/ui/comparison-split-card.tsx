import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import type { ComponentProps } from "react";

interface ComparisonSplitCardProps {
  esquerda: ComponentProps<typeof KpiCard>;
  direita: ComponentProps<typeof KpiCard>;
  progressoEsquerdaPct: number;
}

// Par Aéreo/Terrestre + barra de progresso segmentada única embaixo,
// proporcional à participação de cada lado no total (4.1).
export function ComparisonSplitCard({
  esquerda,
  direita,
  progressoEsquerdaPct,
}: ComparisonSplitCardProps) {
  const progresso = Math.min(100, Math.max(0, progressoEsquerdaPct));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard {...esquerda} />
        <KpiCard {...direita} />
      </div>
      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        <div
          className="h-full transition-all"
          style={{ width: `${progresso}%`, backgroundColor: esquerda.cor }}
        />
        <div className="h-full flex-1 transition-all" style={{ backgroundColor: direita.cor }} />
      </div>
    </div>
  );
}

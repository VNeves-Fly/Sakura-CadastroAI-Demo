import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import type { ComponentProps } from "react";

interface ComparisonSplitCardProps {
  esquerda: ComponentProps<typeof KpiCard>;
  direita: ComponentProps<typeof KpiCard>;
  progressoEsquerdaPct: number;
  // Participação (%) de cada lado no total — mostrada nas pontas da
  // barra (início = esquerda, fim = direita), pra deixar a dominância de
  // cada canal visível de cara, sem precisar ler os cards de cima
  // (pedido do usuário, 2026-08-18).
  participacaoEsquerda: string;
  participacaoDireita: string;
}

// Par Aéreo/Terrestre + barra de progresso segmentada única embaixo,
// proporcional à participação de cada lado no total (4.1).
export function ComparisonSplitCard({
  esquerda,
  direita,
  progressoEsquerdaPct,
  participacaoEsquerda,
  participacaoDireita,
}: ComparisonSplitCardProps) {
  const progresso = Math.min(100, Math.max(0, progressoEsquerdaPct));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCard {...esquerda} />
        <KpiCard {...direita} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full transition-all"
            style={{ width: `${progresso}%`, backgroundColor: esquerda.cor }}
          />
          <div className="h-full flex-1 transition-all" style={{ backgroundColor: direita.cor }} />
        </div>

        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: esquerda.corFundoIcone, color: esquerda.cor }}
          >
            {participacaoEsquerda}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: direita.corFundoIcone, color: direita.cor }}
          >
            {participacaoDireita}
          </span>
        </div>
      </div>
    </div>
  );
}

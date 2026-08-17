import { ResumoDoDiaCard } from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
import { VendasIntradayChart } from "@/modules/dashboard-vendas/components/vendas-intraday-chart";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import type { BucketIntraday } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaSecaoProps {
  intraday: BucketIntraday[];
}

export async function ResumoDoDiaSecao({ intraday }: ResumoDoDiaSecaoProps) {
  const resumoEDia = await dashboardVendasController.obterResumoEDia();
  return (
    <>
      <ResumoDoDiaCard resumoPorPeriodo={resumoEDia.resumoPorPeriodo} />
      <MiniKpisGrid {...resumoEDia.miniKpis} />
      <VendasIntradayChart
        intraday={intraday}
        atualizadoEm={resumoEDia.resumoPorPeriodo.hoje.atualizadoEm}
      />
    </>
  );
}

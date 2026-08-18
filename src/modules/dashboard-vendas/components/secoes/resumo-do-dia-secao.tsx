import { ResumoDoDiaCard } from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
import { VendasIntradayChart } from "@/modules/dashboard-vendas/components/vendas-intraday-chart";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import type { BucketIntraday } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaSecaoProps {
  intraday: BucketIntraday[];
  resumoEDiaPromise: ReturnType<typeof dashboardVendasController.obterResumoEDia>;
}

// Recebe a busca já disparada pelo pai (`DashboardVendasView`), não a
// dispara aqui — é o pai que decide a ordem/timing entre seções (ver
// comentário em dashboard-vendas-view.tsx).
export async function ResumoDoDiaSecao({ intraday, resumoEDiaPromise }: ResumoDoDiaSecaoProps) {
  const resumoEDia = await resumoEDiaPromise;
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

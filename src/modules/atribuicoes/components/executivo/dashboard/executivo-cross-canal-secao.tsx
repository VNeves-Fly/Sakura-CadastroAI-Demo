import { MiniStatsGrid } from "@/modules/atribuicoes/components/executivo/dashboard/mini-stats";
import { CrossCanalCard } from "@/modules/atribuicoes/components/executivo/dashboard/cross-canal-card";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoCrossCanalSecaoProps {
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// Seção mais pesada do dashboard (roster + loop de venda terrestre por
// agência no SST) — fica no seu próprio Suspense, separada de hero/kpis,
// pra não segurar a página inteira atrás da chamada mais lenta (ver
// executivo-dashboard-view.tsx).
export async function ExecutivoCrossCanalSecao({
  crossCanalPromise,
}: ExecutivoCrossCanalSecaoProps) {
  const { crossCanal, miniStats } = await crossCanalPromise;
  return (
    <>
      <MiniStatsGrid miniStats={miniStats} />
      <CrossCanalCard crossCanal={crossCanal} />
    </>
  );
}

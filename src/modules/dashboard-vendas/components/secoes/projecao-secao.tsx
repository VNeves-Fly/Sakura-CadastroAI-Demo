import { ProjecaoDoDiaCard } from "@/modules/dashboard-vendas/components/projecao-do-dia-card";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface ProjecaoSecaoProps {
  projecaoPromise: ReturnType<typeof dashboardVendasController.obterProjecao>;
}

// Recebe a busca já disparada pelo pai (`DashboardVendasView`), não a
// dispara aqui — é o pai que decide a ordem/timing entre seções (ver
// comentário em dashboard-vendas-view.tsx).
export async function ProjecaoSecao({ projecaoPromise }: ProjecaoSecaoProps) {
  const projecao = await projecaoPromise;
  return <ProjecaoDoDiaCard projecao={projecao} />;
}

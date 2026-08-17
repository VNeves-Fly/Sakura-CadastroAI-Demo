import { ProjecaoDoDiaCard } from "@/modules/dashboard-vendas/components/projecao-do-dia-card";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

export async function ProjecaoSecao() {
  const projecao = await dashboardVendasController.obterProjecao();
  return <ProjecaoDoDiaCard projecao={projecao} />;
}

import { ConversaoPanel } from "@/modules/dashboard-vendas/components/conversao-panel";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

export async function ConversaoSecao() {
  const conversao = await dashboardVendasController.obterConversao();
  return <ConversaoPanel conversao={conversao} />;
}

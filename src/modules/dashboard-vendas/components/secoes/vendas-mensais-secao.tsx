import { VendasMensaisChart } from "@/modules/dashboard-vendas/components/vendas-mensais-chart";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

export async function VendasMensaisSecao() {
  const vendasMensais = await dashboardVendasController.obterVendasMensais();
  return <VendasMensaisChart vendasMensais={vendasMensais} />;
}

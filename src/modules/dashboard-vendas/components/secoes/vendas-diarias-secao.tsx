import { VendasDiariasChart } from "@/modules/dashboard-vendas/components/vendas-diarias-chart";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

export async function VendasDiariasSecao() {
  const vendasDiarias = await dashboardVendasController.obterVendasDiarias();
  return <VendasDiariasChart vendasDiarias={vendasDiarias} />;
}

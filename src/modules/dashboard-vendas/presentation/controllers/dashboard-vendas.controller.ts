import { dashboardVendasAdapter } from "@/modules/dashboard-vendas/adapters/dashboard-vendas.adapter";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão do
// `cadastroAdminController`. Adapter sempre antes do consumo dos dados do
// service, nunca o inverso.
export const dashboardVendasController = {
  async obterDashboard() {
    const raw = await dashboardVendasMockService.obterDashboard();
    return dashboardVendasAdapter.toViewModel(raw);
  },
};

import { tvMockService } from "@/modules/tv/services/tv.mock-service";

// Ponto único que a Server Component (page.tsx) chama — mesmo padrão do
// dashboardVendasController. 100% mock por enquanto (sem SST_API_KEY
// nem service real ainda, ver dashboard-vendas.controller.ts pro
// exemplo de como isso troca quando existir fonte real).
export const tvController = {
  async obterDados() {
    return tvMockService.obterDados();
  },
};

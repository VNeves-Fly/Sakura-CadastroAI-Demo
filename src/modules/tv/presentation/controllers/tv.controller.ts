import { tvMockService } from "@/modules/tv/services/tv.mock-service";

// Ponto único que a Server Component (page.tsx) e a API route de
// polling (/api/tv/dados) chamam — mesmo padrão do
// dashboardVendasController. Este é um repositório de DEMONSTRAÇÃO:
// todas as páginas de /crm/ sempre mostram dado fictício rico e coerente
// via tv.mock-service.ts — nunca chama o SST e nunca cai num
// "0/vazio honesto" (decisão do projeto).
export const tvController = {
  async obterDados() {
    return tvMockService.obterDados();
  },
};

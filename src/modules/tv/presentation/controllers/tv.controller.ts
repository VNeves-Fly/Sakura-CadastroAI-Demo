import { tvMockService } from "@/modules/tv/services/tv.mock-service";
import { tvSstService } from "@/modules/tv/services/tv.sst-service";

// Ponto único que a Server Component (page.tsx) e a API route de
// polling (/api/tv/dados) chamam — mesmo padrão do
// dashboardVendasController. Mesmo critério de troca mock/real do resto
// do projeto: com SST_API_KEY configurada, usa o serviço real (que já
// cobre vendas/aereo/terrestre/shareAereo/top10 via SST — ver
// tv.sst-service.ts — com fallback por bloco pro mock se algum endpoint
// falhar).
const tvService = process.env.SST_API_KEY ? tvSstService : tvMockService;

export const tvController = {
  async obterDados() {
    return tvService.obterDados();
  },
};

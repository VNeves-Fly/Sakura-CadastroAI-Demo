import { novasAgenciasMockService } from "@/modules/novas-agencias/services/novas-agencias.mock-service";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão
// do resto do projeto (ver dashboard-vendas.controller.ts). Hoje só
// existe o serviço mock: a SPEC desta página pediu explicitamente
// "sem nenhuma lógica de backend real" — se um dia existir uma fonte
// real, ela entra aqui do mesmo jeito que dashboardVendasController
// alterna mock/SST, sem precisar tocar na View.
export const novasAgenciasController = {
  async obterNovasAgencias() {
    return novasAgenciasMockService.obterNovasAgencias();
  },
};

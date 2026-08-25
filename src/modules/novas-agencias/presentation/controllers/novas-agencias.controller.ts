import { carregarNovasAgencias } from "@/modules/novas-agencias/services/novas-agencias.loader";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão
// do resto do projeto (ver dashboard-vendas.controller.ts). Identidade e
// entrada das agências vêm sempre do Prisma local; métricas de venda
// vêm do SST quando SST_API_KEY está configurada, com fallback mock por
// linha (ver novas-agencias.loader.ts/adapter.ts).
export const novasAgenciasController = {
  async obterNovasAgencias() {
    return carregarNovasAgencias();
  },
};

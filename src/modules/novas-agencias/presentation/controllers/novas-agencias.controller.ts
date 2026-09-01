import { carregarNovasAgencias } from "@/modules/novas-agencias/services/novas-agencias.loader";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão
// do resto do projeto (ver dashboard-vendas.controller.ts). Demo 100%
// mock (sem Prisma/SST) — ver novas-agencias.loader.ts/adapter.ts.
export const novasAgenciasController = {
  async obterNovasAgencias() {
    return carregarNovasAgencias();
  },
};

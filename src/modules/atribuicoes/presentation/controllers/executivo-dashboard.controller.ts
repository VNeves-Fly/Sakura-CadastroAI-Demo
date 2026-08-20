import { executivoDashboardMockService } from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
import { executivoDashboardSstService } from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";
import type {
  ExecutivoAgenciaResumo,
  ExecutivoDashboard,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

export type FonteDashboardExecutivo = "sst" | "mock" | "indisponivel";

export interface ResultadoDashboardExecutivo {
  dashboard: ExecutivoDashboard;
  fonte: FonteDashboardExecutivo;
}

// Ponto único de decisão mock↔real do dashboard do executivo (mesmo
// critério do dashboard-vendas.controller.ts): SST_API_KEY configurada
// liga o serviço real. Checagem de `sica` vem antes — sem código SICA não
// há `codigoExecutivo` pra filtrar no SST, então nem tenta a chamada real
// nem finge mock como se fosse dado de verdade (promotores importados só
// do export legado "gerentes_conta" não têm SICA, ver
// prisma/schema.prisma `Promotor.sica`).
export const executivoDashboardController = {
  async obterDashboard(
    sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<ResultadoDashboardExecutivo> {
    if (sica == null) {
      const dashboard = await executivoDashboardMockService.obterDashboard(
        promotorId,
        totalAgencias,
        agencias,
      );
      return { dashboard, fonte: "indisponivel" };
    }

    if (process.env.SST_API_KEY) {
      const dashboard = await executivoDashboardSstService.obterDashboard(
        sica,
        promotorId,
        agencias,
      );
      return { dashboard, fonte: "sst" };
    }

    const dashboard = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    return { dashboard, fonte: "mock" };
  },
};

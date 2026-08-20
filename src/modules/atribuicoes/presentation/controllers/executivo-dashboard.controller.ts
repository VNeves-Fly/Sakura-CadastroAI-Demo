import { executivoDashboardMockService } from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
import { executivoDashboardSstService } from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";
import type {
  ExecutivoAgenciaResumo,
  ExecutivoDashboard,
  KpisSecundarios,
  MiniStats,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Ponto único de decisão mock↔real do dashboard do executivo (mesmo
// critério do dashboard-vendas.controller.ts): SST_API_KEY configurada +
// `sica` não nulo liga o serviço real. Sem código SICA não há
// `codigoExecutivo` pra filtrar no SST (promotores importados só do
// export legado "gerentes_conta" não têm SICA, ver prisma/schema.prisma
// `Promotor.sica`) — cai pro mock, e a view sinaliza esse caso lendo
// `perfil.sica` diretamente (ver executivo-dashboard-view.tsx), sem
// precisar de um contrato de "fonte" aqui.
//
// Duas seções granulares (não um `obterDashboard` só) — pedido do usuário
// (2026-08-20): a página estava demorando muito pra abrir porque esperava
// hero+kpis (rápido) e crossCanal+miniStats (pesado, loop por agência)
// resolverem juntos. Separadas, `page.tsx`/`executivo-dashboard-view.tsx`
// mostram hero+kpis assim que prontos e só a seção pesada fica atrás de
// Suspense.
function usaSstReal(sica: number | null): sica is number {
  return sica != null && Boolean(process.env.SST_API_KEY);
}

export const executivoDashboardController = {
  async obterHeroKpis(
    sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<{ hero: ExecutivoDashboard["hero"]; kpis: KpisSecundarios }> {
    if (usaSstReal(sica)) {
      return executivoDashboardSstService.obterHeroKpis(sica, promotorId, totalAgencias, agencias);
    }
    const mock = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    return { hero: mock.hero, kpis: mock.kpis };
  },

  async obterCrossCanalEMiniStats(
    sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<{ crossCanal: ExecutivoDashboard["crossCanal"]; miniStats: MiniStats }> {
    if (usaSstReal(sica)) {
      return executivoDashboardSstService.obterCrossCanalEMiniStats(
        sica,
        promotorId,
        totalAgencias,
        agencias,
      );
    }
    const mock = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    return { crossCanal: mock.crossCanal, miniStats: mock.miniStats };
  },

  // Campos que nunca dependem do SST hoje — sem componente de UI pra
  // vendasMensais/tendencia30d/topAgencias (ver executivo-dashboard.sst-service.ts)
  // e saudeCarteira/fidelidadePorCompanhia/paradasComHistorico/emQueda
  // bloqueados por decisão de negócio (ver plano de implementação).
  // Resolve na hora (sem I/O) — não precisa de Suspense.
  async obterSecoesEstaticas(
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<
    Pick<
      ExecutivoDashboard,
      | "saudeCarteira"
      | "fidelidadePorCompanhia"
      | "vendasMensais"
      | "vendasMensaisTotalAno"
      | "vendasMensaisVariacaoAltaPct"
      | "vendasMensaisVariacaoBaixaPct"
      | "tendencia30d"
      | "tendencia30dTotal"
      | "topAgenciasMes"
      | "topAgenciasAno"
      | "paradasComHistorico"
      | "emQueda"
    >
  > {
    return executivoDashboardMockService.obterDashboard(promotorId, totalAgencias, agencias);
  },
};

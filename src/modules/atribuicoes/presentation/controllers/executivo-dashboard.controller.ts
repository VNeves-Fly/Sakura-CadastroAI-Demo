import { executivoDashboardMockService } from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
import { executivoDashboardSstService } from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";
import {
  crossCanalVazio,
  heroVazio,
  kpisVazios,
  margemRentabVazio,
  saudeCarteiraVazia,
} from "@/modules/atribuicoes/utils/executivo-dashboard-vazio.util";
import type {
  AgenciaCarteiraResumo,
  ExecutivoAgenciaResumo,
  ExecutivoDashboard,
  KpisSecundarios,
  MargemRentabExecutivo,
  MiniStats,
  SegmentoSaude,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Ponto único de decisão real↔vazio do dashboard do executivo (mesmo
// critério do dashboard-vendas.controller.ts): SST_API_KEY configurada +
// `sica` não nulo liga o serviço real. Sem código SICA não há
// `codigoExecutivo` pra filtrar no SST (promotores importados só do
// export legado "gerentes_conta" não têm SICA, ver prisma/schema.prisma
// `Promotor.sica`) — cai pro "0/vazio honesto" (ver
// executivo-dashboard-vazio.util.ts; até 2026-08-25 caía pro mock —
// decisão do usuário nessa data: nunca mais inventar número plausível
// pra disfarçar dado ausente), e a view sinaliza esse caso lendo
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
  ): Promise<{
    hero: ExecutivoDashboard["hero"];
    kpis: KpisSecundarios;
    margemRentab: MargemRentabExecutivo;
  }> {
    if (usaSstReal(sica)) {
      return executivoDashboardSstService.obterHeroKpis(sica, promotorId, totalAgencias, agencias);
    }
    return { hero: heroVazio(), kpis: kpisVazios(), margemRentab: margemRentabVazio() };
  },

  // `saudeCarteira` vem junto (mesma chamada/loop por agência de
  // crossCanal — sem custo extra ao SST); reinterpretada por recência de
  // venda + `empresa_status` do roster, não por limite de crédito
  // (bloqueado, ver executivo-dashboard.sst-service.ts).
  async obterCrossCanalEMiniStats(
    sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<{
    crossCanal: ExecutivoDashboard["crossCanal"];
    miniStats: MiniStats;
    saudeCarteira: SegmentoSaude[];
    agenciasCarteira: AgenciaCarteiraResumo[];
  }> {
    if (usaSstReal(sica)) {
      return executivoDashboardSstService.obterCrossCanalEMiniStats(
        sica,
        promotorId,
        totalAgencias,
        agencias,
      );
    }
    // `ociosasLimite`/`comCredito` não têm fonte real no SST hoje (ver
    // executivo-dashboard.sst-service.ts) — únicos dois campos que
    // continuam vindo do mock mesmo aqui, não é sobre falta de SICA.
    const mock = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    return {
      crossCanal: crossCanalVazio(totalAgencias),
      miniStats: {
        agencias: totalAgencias,
        vendendo30d: 0,
        vendendo30dPct: 0,
        ociosasLimite: mock.miniStats.ociosasLimite,
        comCredito: mock.miniStats.comCredito,
      },
      saudeCarteira: saudeCarteiraVazia(),
      // sem SICA não há como filtrar o SST por executivo — sem lista real
      // de agências, mostra vazio em vez de inventar linhas.
      agenciasCarteira: [],
    };
  },

  // Versão enxuta pras listagens (/crm/executivos, /crm/gestores) — só
  // vendasMes/vendasAno, sem o hero completo. Sem SICA (ou SST fora do ar)
  // devolve 0 honesto, não um número mock inventado: a listagem não tem
  // `agencias`/`totalAgencias` disponíveis pra alimentar
  // executivoDashboardMockService, e um "sem dado real" aqui já vira o
  // badge "Sem venda" que a UI já mostra (ver promotor-lista.adapter.ts).
  async obterVendasResumo(sica: number | null): Promise<{ vendasMes: number; vendasAno: number }> {
    if (!usaSstReal(sica)) return { vendasMes: 0, vendasAno: 0 };
    try {
      return await executivoDashboardSstService.obterVendasResumo(sica);
    } catch (erro) {
      console.error(`[executivo-lista] "vendasResumo" falhou contra o SST — usando 0.`, erro);
      return { vendasMes: 0, vendasAno: 0 };
    }
  },
};

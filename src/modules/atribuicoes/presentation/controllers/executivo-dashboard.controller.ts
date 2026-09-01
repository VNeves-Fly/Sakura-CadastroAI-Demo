import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { executivoDashboardMockService } from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
import type {
  AgenciaCarteiraResumo,
  ExecutivoAgenciaResumo,
  ExecutivoDashboard,
  KpisSecundarios,
  MargemRentabExecutivo,
  MiniStats,
  SegmentoSaude,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Repositório de DEMONSTRAÇÃO: nunca chama o SST real e nunca devolve
// "vazio honesto" — toda página de /crm/ sempre mostra dado fictício rico
// (decisão do usuário, 2026-09-01, substitui o gate `usaSstReal`/
// `SST_API_KEY` que existia aqui e o "0/vazio" de 2026-08-25). `sica`
// continua no parâmetro só pra manter a assinatura usada pelos callers
// (page.tsx, gestor-dashboard.controller.ts, promotores.routes.ts etc.),
// mas não influencia mais a decisão de fonte.
//
// Duas seções granulares (não um `obterDashboard` só) — pedido do usuário
// (2026-08-20): a página estava demorando muito pra abrir porque esperava
// hero+kpis (rápido) e crossCanal+miniStats (pesado, loop por agência)
// resolverem juntos. Separadas, `page.tsx`/`executivo-dashboard-view.tsx`
// mostram hero+kpis assim que prontos e só a seção pesada fica atrás de
// Suspense.

export const executivoDashboardController = {
  async obterHeroKpis(
    _sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<{
    hero: ExecutivoDashboard["hero"];
    kpis: KpisSecundarios;
    margemRentab: MargemRentabExecutivo;
  }> {
    const mock = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    return { hero: mock.hero, kpis: mock.kpis, margemRentab: mock.margemRentab };
  },

  // `saudeCarteira` vem junto (mesmo mock de `obterDashboard`, sem chamada
  // extra) — mantém a mesma assinatura de retorno que existia quando este
  // método podia chamar o SST real (ver executivo-dashboard.sst-service.ts,
  // ainda usado pelo popover de período personalizado em
  // executivo-dashboard.actions.ts, fora do escopo desta função).
  async obterCrossCanalEMiniStats(
    _sica: number | null,
    promotorId: string,
    totalAgencias: number,
    agencias: ExecutivoAgenciaResumo[],
  ): Promise<{
    crossCanal: ExecutivoDashboard["crossCanal"];
    miniStats: MiniStats;
    saudeCarteira: SegmentoSaude[];
    agenciasCarteira: AgenciaCarteiraResumo[];
  }> {
    const mock = await executivoDashboardMockService.obterDashboard(
      promotorId,
      totalAgencias,
      agencias,
    );
    const agenciasCarteira = executivoDashboardMockService.gerarAgenciasCarteira(
      agencias,
      hashParaNumero(promotorId),
    );
    return {
      crossCanal: mock.crossCanal,
      miniStats: mock.miniStats,
      saudeCarteira: mock.saudeCarteira,
      agenciasCarteira,
    };
  },

  // Versão enxuta pras listagens (/crm/executivos, /crm/gestores) — só
  // vendasMes/vendasAno, sem o hero completo. Sempre mock determinístico
  // (por `sica` quando existe, senão um placeholder fixo) — a listagem não
  // tem `agencias`/`totalAgencias` disponíveis pra alimentar
  // executivoDashboardMockService.obterDashboard, então usa o gerador
  // enxuto equivalente.
  async obterVendasResumo(sica: number | null): Promise<{ vendasMes: number; vendasAno: number }> {
    return executivoDashboardMockService.obterVendasResumo(
      sica != null ? `sica:${sica}` : "sem-sica",
    );
  },
};

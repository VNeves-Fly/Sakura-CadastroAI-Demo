import { cache } from "react";
import {
  dashboardVendasAdapter,
  normalizarCruzamento,
  normalizarResumoPorPeriodo,
} from "@/modules/dashboard-vendas/adapters/dashboard-vendas.adapter";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import { dashboardVendasSstService } from "@/modules/dashboard-vendas/services/dashboard-vendas.sst-service";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão do
// `cadastroAdminController`. Adapter sempre antes do consumo dos dados do
// service, nunca o inverso.
//
// Mesmo critério de troca mock/real do resto do projeto (ver
// cadastro-admin.controller.ts): com SST_API_KEY configurada, usa o
// serviço real (que já cobre resumo/miniKpis/rankings/nacional×internacional
// via SST — ver dashboard-vendas.sst-service.ts — e cai pro mock só nas
// seções ainda sem fonte real).
const dashboardVendasService = process.env.SST_API_KEY
  ? dashboardVendasSstService
  : dashboardVendasMockService;

// Métodos granulares (além de `obterDashboard`) pra alimentar o
// carregamento progressivo de `dashboard-new/page.tsx` — cada seção
// pesada é buscada e normalizada por conta própria, sem esperar as
// outras (ver Suspense na página).
export const dashboardVendasController = {
  async obterDashboard() {
    const raw = await dashboardVendasService.obterDashboard();
    return dashboardVendasAdapter.toViewModel(raw);
  },
  async obterMockEstatico() {
    // intraday/acuracia continuam sempre mock — ver docs/faltante.md.
    // projecao saiu daqui: agora pagina o SST (curva horária) e pode ser
    // lenta, por isso tem seu próprio método granular (`obterProjecao`),
    // igual às outras seções pesadas — ver `obterMockEstatico` precisa
    // continuar rápida/síncrona pra não bloquear a página inteira.
    return dashboardVendasMockService.obterMockEstatico();
  },
  async obterProjecao() {
    return dashboardVendasService.obterProjecao();
  },
  // `cache()` (memoização por request do React) — `ResumoDoDiaSecao` e
  // `RankingsSecao` chamam isto de forma independente (cada uma no seu
  // próprio Suspense, pra a página abrir com tudo em placeholder), sem
  // isto duplicariam a busca cara no SST (overview/top-agências/ranking
  // de cias/nac-int) uma vez por seção.
  obterResumoEDia: cache(async () => {
    const dados = await dashboardVendasService.obterResumoEDia();
    return { ...dados, resumoPorPeriodo: normalizarResumoPorPeriodo(dados.resumoPorPeriodo) };
  }),
  async obterVendasMensais() {
    return dashboardVendasService.obterVendasMensais();
  },
  async obterVendasDiarias() {
    return dashboardVendasService.obterVendasDiarias();
  },
  async obterConversao() {
    return dashboardVendasService.obterConversao();
  },
  async obterRecenciaECruzamento() {
    const dados = await dashboardVendasService.obterRecenciaECruzamento();
    return { ...dados, cruzamentoCanais: normalizarCruzamento(dados.cruzamentoCanais) };
  },
};

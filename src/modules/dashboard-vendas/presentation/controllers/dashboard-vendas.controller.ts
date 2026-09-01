import { cache } from "react";
import {
  dashboardVendasAdapter,
  normalizarCruzamento,
  normalizarResumo,
  normalizarResumoPorPeriodo,
} from "@/modules/dashboard-vendas/adapters/dashboard-vendas.adapter";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import type { ResumoPersonalizado } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão do
// `cadastroAdminController`. Adapter sempre antes do consumo dos dados do
// service, nunca o inverso.
//
// Projeto de DEMONSTRAÇÃO (ver CLAUDE.md/README) — todas as páginas de
// /crm/ mostram sempre dados fictícios ricos, nunca chamam o SST nem
// devolvem "vazio/zero honesto". Por isso, diferente de outros
// controllers do projeto (ex. executivo-dashboard.controller.ts), aqui
// não existe mais um gate `SST_ATIVO`/fallback pra vazio: todo método
// chama incondicionalmente o serviço mock (dashboard-vendas.mock-
// service.ts), sempre passando pelo adapter/normalizadores como antes.
export const dashboardVendasController = {
  // Não usado hoje pelas páginas ao vivo (só em teste) — mantido no
  // padrão antigo (troca de serviço inteiro) pra não reescrever um
  // caminho morto; os métodos granulares abaixo são os que a UI real usa.
  async obterDashboard() {
    const raw = await dashboardVendasMockService.obterDashboard();
    return dashboardVendasAdapter.toViewModel(raw);
  },
  async obterMockEstatico() {
    // intraday/acuracia sempre mock — ver docs/faltante.md.
    return dashboardVendasMockService.obterMockEstatico();
  },
  async obterProjecao() {
    return dashboardVendasMockService.obterProjecao();
  },
  // `cache()` (memoização por request do React) — `ResumoDoDiaSecao` e
  // `RankingsSecao` chamam isto de forma independente (cada uma no seu
  // próprio Suspense, pra a página abrir com tudo em placeholder), sem
  // isto duplicariam a busca do mock uma vez por seção.
  obterResumoEDia: cache(async () => {
    const dados = await dashboardVendasMockService.obterResumoEDia();
    return { ...dados, resumoPorPeriodo: normalizarResumoPorPeriodo(dados.resumoPorPeriodo) };
  }),
  async obterVendasMensais() {
    return dashboardVendasMockService.obterVendasMensais();
  },
  async obterVendasDiarias() {
    return dashboardVendasMockService.obterVendasDiarias();
  },
  async obterConversao() {
    return dashboardVendasMockService.obterConversao();
  },
  async obterRecenciaECruzamento() {
    const dados = await dashboardVendasMockService.obterRecenciaECruzamento();
    return { ...dados, cruzamentoCanais: normalizarCruzamento(dados.cruzamentoCanais) };
  },
  // Sob demanda (não faz parte do carregamento inicial da página) — só
  // chamado pela Server Action do filtro "Personalizado"
  // (dashboard-vendas.actions.ts) quando o usuário aplica um intervalo.
  // Sempre mock, nunca `null` — este é um repositório de demonstração,
  // então mesmo um intervalo arbitrário precisa devolver dado fictício
  // rico (ver dashboard-vendas.mock-service.ts,
  // construirResumoPersonalizadoMock).
  async obterResumoPersonalizado(inicioIso: string, fimIso: string): Promise<ResumoPersonalizado> {
    const dados = await dashboardVendasMockService.obterResumoPersonalizado(inicioIso, fimIso);
    return { ...dados, resumo: normalizarResumo(dados.resumo) };
  },
};

import { cache } from "react";
import {
  dashboardVendasAdapter,
  normalizarCruzamento,
  normalizarResumo,
  normalizarResumoPorPeriodo,
} from "@/modules/dashboard-vendas/adapters/dashboard-vendas.adapter";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import { dashboardVendasSstService } from "@/modules/dashboard-vendas/services/dashboard-vendas.sst-service";
import {
  conversaoVazia,
  projecaoVazia,
  recenciaECruzamentoVazio,
  resumoEDiaVazio,
} from "@/modules/dashboard-vendas/utils/dashboard-vendas-vazio.util";
import type { ResumoPersonalizado } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Ponto único que a Server Component (`page.tsx`) chama — mesmo padrão do
// `cadastroAdminController`. Adapter sempre antes do consumo dos dados do
// service, nunca o inverso.
//
// Mesmo critério real↔vazio do resto do projeto (ver
// executivo-dashboard.controller.ts): com SST_API_KEY configurada, usa o
// serviço real (que já cobre resumo/miniKpis/rankings/nacional×internacional
// via SST — ver dashboard-vendas.sst-service.ts, com seu próprio fallback
// pra "0/vazio honesto" por seção se uma chamada falhar). Sem a chave, cada
// método granular devolve "0/vazio honesto" direto (nunca mais o mock —
// decisão do usuário, 2026-08-25) — exceto `obterMockEstatico`, que segue
// sempre mock por não ter fonte real nenhuma ainda (ver comentário abaixo).
const SST_ATIVO = Boolean(process.env.SST_API_KEY);

// Métodos granulares (além de `obterDashboard`) pra alimentar o
// carregamento progressivo de `crm/dashboard/page.tsx` — cada seção
// pesada é buscada e normalizada por conta própria, sem esperar as
// outras (ver Suspense na página).
export const dashboardVendasController = {
  // Não usado hoje pelas páginas ao vivo (só em teste) — mantido no
  // padrão antigo (troca de serviço inteiro) pra não reescrever um
  // caminho morto; os métodos granulares abaixo são os que a UI real usa.
  async obterDashboard() {
    const raw = await (
      SST_ATIVO ? dashboardVendasSstService : dashboardVendasMockService
    ).obterDashboard();
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
    if (!SST_ATIVO) return projecaoVazia();
    return dashboardVendasSstService.obterProjecao();
  },
  // `cache()` (memoização por request do React) — `ResumoDoDiaSecao` e
  // `RankingsSecao` chamam isto de forma independente (cada uma no seu
  // próprio Suspense, pra a página abrir com tudo em placeholder), sem
  // isto duplicariam a busca cara no SST (overview/top-agências/ranking
  // de cias/nac-int) uma vez por seção.
  obterResumoEDia: cache(async () => {
    const dados = SST_ATIVO ? await dashboardVendasSstService.obterResumoEDia() : resumoEDiaVazio();
    return { ...dados, resumoPorPeriodo: normalizarResumoPorPeriodo(dados.resumoPorPeriodo) };
  }),
  async obterVendasMensais() {
    if (!SST_ATIVO) return [];
    return dashboardVendasSstService.obterVendasMensais();
  },
  async obterVendasDiarias() {
    if (!SST_ATIVO) return [];
    return dashboardVendasSstService.obterVendasDiarias();
  },
  async obterConversao() {
    if (!SST_ATIVO) return conversaoVazia();
    return dashboardVendasSstService.obterConversao();
  },
  async obterRecenciaECruzamento() {
    const dados = SST_ATIVO
      ? await dashboardVendasSstService.obterRecenciaECruzamento()
      : recenciaECruzamentoVazio();
    return { ...dados, cruzamentoCanais: normalizarCruzamento(dados.cruzamentoCanais) };
  },
  // Sob demanda (não faz parte do carregamento inicial da página) — só
  // chamado pela Server Action do filtro "Personalizado"
  // (dashboard-vendas.actions.ts) quando o usuário aplica um intervalo.
  // `null` = SST não configurado neste ambiente (sem `SST_API_KEY`);
  // diferente dos métodos acima, não tem "0/vazio honesto" aqui porque
  // não existe um intervalo "vazio" óbvio pra devolver — melhor deixar o
  // client saber que não há fonte real, em vez de fabricar zeros.
  async obterResumoPersonalizado(
    inicioIso: string,
    fimIso: string,
  ): Promise<ResumoPersonalizado | null> {
    if (!SST_ATIVO) return null;
    const dados = await dashboardVendasSstService.obterResumoPersonalizado(inicioIso, fimIso);
    return { ...dados, resumo: normalizarResumo(dados.resumo) };
  },
};

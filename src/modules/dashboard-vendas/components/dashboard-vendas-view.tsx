import { Suspense } from "react";
// "Vendas Intraday", "Acurácia da projeção", "Vendas Mensais" e "Vendas
// Diárias" ocultadas a pedido do usuário (2026-08-18) — a disposição do
// dashboard passou a seguir só as seções do print de referência
// (SPEC_Dashboard_Sakura.md); estas ficam pra uma fase futura. Imports
// comentados junto pra não sobrar warning de unused-import; é só
// descomentar os blocos (import + JSX/promise abaixo, e o comentário
// irmão em resumo-do-dia-secao.tsx pro caso do Intraday) pra trazer de
// volta.
// import { AcuraciaProjecaoPanel } from "@/modules/dashboard-vendas/components/acuracia-projecao-panel";
import { ResumoDoDiaSecao } from "@/modules/dashboard-vendas/components/secoes/resumo-do-dia-secao";
import { RankingsSecao } from "@/modules/dashboard-vendas/components/secoes/rankings-secao";
import { ProjecaoSecao } from "@/modules/dashboard-vendas/components/secoes/projecao-secao";
import { RecenciaECruzamentoSecao } from "@/modules/dashboard-vendas/components/secoes/recencia-e-cruzamento-secao";
import { ConversaoSecao } from "@/modules/dashboard-vendas/components/secoes/conversao-secao";
// import { VendasMensaisSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-mensais-secao";
// import { VendasDiariasSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-diarias-secao";
// `SecaoSkeleton` (retângulo cinza genérico) só era usado pelas 5 seções
// ativas abaixo, que agora têm skeleton fiel ao layout real (pedido do
// usuário, 2026-08-25: o layout tem que carregar na hora, só os valores
// ficam em loading). Import comentado (mesmo motivo dos outros acima) —
// ainda é usado pelo bloco comentado de Vendas Mensais/Diárias no fim
// deste arquivo, é só descomentar os dois juntos.
// import { SecaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/secao-skeleton";
import { ResumoDoDiaSkeleton } from "@/modules/dashboard-vendas/components/secoes/resumo-do-dia-skeleton";
import { RankingsSkeleton } from "@/modules/dashboard-vendas/components/secoes/rankings-skeleton";
import { ProjecaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/projecao-skeleton";
import { RecenciaECruzamentoSkeleton } from "@/modules/dashboard-vendas/components/secoes/recencia-e-cruzamento-skeleton";
import { ConversaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/conversao-skeleton";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

// Encadeia a busca de uma seção depois que `gate` resolveu OU rejeitou —
// nunca propaga a rejeição de `gate` pra `tarefa` (só usa `gate` pra
// esperar o timing, o erro de cada seção continua sendo só o dela
// mesma). Sem isso, um `.then()` comum faria a falha de uma seção
// derrubar em cascata todas as seções encadeadas depois dela.
function depoisDe<T>(gate: Promise<unknown>, tarefa: () => Promise<T>): Promise<T> {
  return gate.catch(() => undefined).then(() => tarefa());
}

// Orquestra as seções na ordem do print de referência (SPEC_Dashboard_
// Sakura.md): Resumo do dia -> Rankings -> Projeção -> Recência/
// Cruzamento -> Conversão. `RankingsSecao` reusa `obterResumoEDia`
// (memoizado por request via `cache()`, ver controller) — mesma busca
// de `ResumoDoDiaSecao`, sem chamada nova, por isso abre junto/logo
// depois dela, sem precisar de `depoisDe`.
//
// Carregamento progressivo, mas em fila (top-to-bottom): a página abre
// na hora, com toda seção que depende do SST em placeholder
// (`Suspense`). As seções pesadas não disparam mais suas buscas no SST
// todas de uma vez — cada uma só começa depois que a anterior (na ordem
// visual) terminou, via `depoisDe`. Evita a concorrência que já esgotou
// o retry de 5xx do SST numa carga real (ver comFallback em
// dashboard-vendas.sst-service.ts).
export function DashboardVendasView() {
  const resumoEDiaPromise = dashboardVendasController.obterResumoEDia();
  const projecaoPromise = depoisDe(resumoEDiaPromise, () =>
    dashboardVendasController.obterProjecao(),
  );
  const recenciaECruzamentoPromise = depoisDe(projecaoPromise, () =>
    dashboardVendasController.obterRecenciaECruzamento(),
  );
  const conversaoPromise = depoisDe(recenciaECruzamentoPromise, () =>
    dashboardVendasController.obterConversao(),
  );

  return (
    // "dashboard-vendas-scope" dá vida às vars --dv-* (ver
    // constants/dashboard-vendas.constants.ts + .dashboard-vendas-scope
    // em globals.css) — sem esta classe em algum ancestral, os
    // `var(--dv-*)` não resolvem e as cores somem.
    <div className="dashboard-vendas-scope flex flex-col gap-4">
      {/* "Vendas Intraday" oculta a pedido do usuário (2026-08-18) — ver
          comentário no import acima e em resumo-do-dia-secao.tsx. */}
      <Suspense fallback={<ResumoDoDiaSkeleton />}>
        <ResumoDoDiaSecao resumoEDiaPromise={resumoEDiaPromise} />
      </Suspense>

      {/* 2 colunas (Top 10 Agências / Top 10 Fornecedores) — "Nacional vs
          Internacional" saiu daqui (ver rankings-secao.tsx). Mesmo gap-4
          das outras linhas da página, pra alinhar as bordas dos cards
          entre as linhas (gap em % descasava com as linhas vizinhas,
          pedido do usuário, 2026-08-19). */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Suspense fallback={<RankingsSkeleton />}>
          <RankingsSecao resumoEDiaPromise={resumoEDiaPromise} />
        </Suspense>
      </div>

      <Suspense fallback={<ProjecaoSkeleton />}>
        <ProjecaoSecao projecaoPromise={projecaoPromise} />
      </Suspense>

      {/* "Acurácia da projeção" oculta a pedido do usuário (2026-08-18) —
          ver comentário no import acima.
      <AcuraciaProjecaoPanel acuracia={mockEstatico.acuracia} />
      */}

      <Suspense fallback={<RecenciaECruzamentoSkeleton />}>
        <RecenciaECruzamentoSecao recenciaECruzamentoPromise={recenciaECruzamentoPromise} />
      </Suspense>

      <Suspense fallback={<ConversaoSkeleton />}>
        <ConversaoSecao conversaoPromise={conversaoPromise} />
      </Suspense>

      {/* "Vendas Mensais" e "Vendas Diárias" ocultas a pedido do usuário
          (2026-08-18) — ver comentário no import acima.
      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasMensaisSecao vendasMensaisPromise={vendasMensaisPromise} />
      </Suspense>
      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasDiariasSecao vendasDiariasPromise={vendasDiariasPromise} />
      </Suspense>
      */}
    </div>
  );
}

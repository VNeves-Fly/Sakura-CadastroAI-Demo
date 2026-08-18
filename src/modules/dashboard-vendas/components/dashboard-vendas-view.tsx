import { Suspense } from "react";
import { ResumoDoDiaCard } from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
// "Vendas Intraday" e "Vendas Diárias" ocultadas a pedido do usuário
// (2026-08-17) — ele pretende repensar essas duas seções futuramente.
// Import comentado junto pra não sobrar warning de unused-import; é só
// descomentar os dois blocos (import + JSX abaixo) pra trazer de volta.
// import { VendasIntradayChart } from "@/modules/dashboard-vendas/components/vendas-intraday-chart";
import { ProjecaoDoDiaCard } from "@/modules/dashboard-vendas/components/projecao-do-dia-card";
import { AcuraciaProjecaoPanel } from "@/modules/dashboard-vendas/components/acuracia-projecao-panel";
import { ResumoDoDiaSecao } from "@/modules/dashboard-vendas/components/secoes/resumo-do-dia-secao";
import { RankingsSecao } from "@/modules/dashboard-vendas/components/secoes/rankings-secao";
import { ProjecaoSecao } from "@/modules/dashboard-vendas/components/secoes/projecao-secao";
import { RecenciaECruzamentoSecao } from "@/modules/dashboard-vendas/components/secoes/recencia-e-cruzamento-secao";
import { ConversaoSecao } from "@/modules/dashboard-vendas/components/secoes/conversao-secao";
import { VendasMensaisSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-mensais-secao";
// import { VendasDiariasSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-diarias-secao";
import { SecaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/secao-skeleton";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import type { DashboardVendasData } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

type MockEstatico = Pick<DashboardVendasData, "intraday" | "acuracia">;

interface DashboardVendasViewProps {
  mockEstatico: MockEstatico;
}

// Encadeia a busca de uma seção depois que `gate` resolveu OU rejeitou —
// nunca propaga a rejeição de `gate` pra `tarefa` (só usa `gate` pra
// esperar o timing, o erro de cada seção continua sendo só o dela
// mesma). Sem isso, um `.then()` comum faria a falha de uma seção
// derrubar em cascata todas as seções encadeadas depois dela.
function depoisDe<T>(gate: Promise<unknown>, tarefa: () => Promise<T>): Promise<T> {
  return gate.catch(() => undefined).then(() => tarefa());
}

// Orquestra as seções na ordem da spec (4.1 → 4.11), com uma diferença
// deliberada: `recencia` e `cruzamentoCanais` (4.6 e 4.11 na spec) agora
// ficam lado a lado, porque streamam juntas — as duas dependem da mesma
// busca cara no SST (ver RecenciaECruzamentoSecao). O resto continua na
// ordem original.
//
// Carregamento progressivo, mas em fila (top-to-bottom): a página abre
// na hora, com TODA seção que depende do SST em placeholder (`Suspense`)
// — só `mockEstatico` chega pronto (puro mock em memória, sem I/O). As
// seções pesadas, porém, não disparam mais suas buscas no SST todas de
// uma vez — cada uma só começa depois que a anterior (na ordem visual)
// terminou, via `depoisDe`. Evita a concorrência que já esgotou o retry
// de 5xx do SST numa carga real (ver comFallback em
// dashboard-vendas.sst-service.ts). `RankingsSecao` reusa `obterResumoEDia`
// (memoizado por request via `cache()`, ver controller) — só é encadeada
// aqui pra também abrir por último, na ordem visual.
export function DashboardVendasView({ mockEstatico }: DashboardVendasViewProps) {
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
  const vendasMensaisPromise = depoisDe(conversaoPromise, () =>
    dashboardVendasController.obterVendasMensais(),
  );
  const vendasDiariasPromise = depoisDe(vendasMensaisPromise, () =>
    dashboardVendasController.obterVendasDiarias(),
  );
  const rankingsResumoEDiaPromise = depoisDe(vendasDiariasPromise, () => resumoEDiaPromise);

  return (
    // "dashboard-vendas-scope" dá vida às vars --dv-* (ver
    // constants/dashboard-vendas.constants.ts + .dashboard-vendas-scope
    // em globals.css) — sem esta classe em algum ancestral, os
    // `var(--dv-*)` não resolvem e as cores somem.
    <div className="dashboard-vendas-scope flex flex-col gap-4">
      <ResumoDoDiaCard resumoPorPeriodo={resumoEDia.resumoPorPeriodo} />
      <MiniKpisGrid {...resumoEDia.miniKpis} />
      {/* "Vendas Intraday" oculta a pedido do usuário (2026-08-17) — ver
          comentário no import acima. */}
      <ProjecaoDoDiaCard projecao={mockEstatico.projecao} />
      <Suspense
        fallback={
          <>
            <SecaoSkeleton altura="h-24" />
            <SecaoSkeleton altura="h-24" />
            <SecaoSkeleton altura="h-64" />
          </>
        }
      >
        <ResumoDoDiaSecao intraday={mockEstatico.intraday} resumoEDiaPromise={resumoEDiaPromise} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-72" />}>
        <ProjecaoSecao projecaoPromise={projecaoPromise} />
      </Suspense>

      <AcuraciaProjecaoPanel acuracia={mockEstatico.acuracia} />

      <Suspense fallback={<SecaoSkeleton altura="h-72" />}>
        <RecenciaECruzamentoSecao recenciaECruzamentoPromise={recenciaECruzamentoPromise} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-48" />}>
        <ConversaoSecao conversaoPromise={conversaoPromise} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasMensaisSecao vendasMensaisPromise={vendasMensaisPromise} />
      </Suspense>

      {/* "Vendas Diárias" oculta a pedido do usuário (2026-08-17) — ver
          comentário no import acima.
      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasDiariasSecao vendasDiariasPromise={vendasDiariasPromise} />
      </Suspense>
      */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Suspense
          fallback={
            <>
              <SecaoSkeleton altura="h-56" />
              <SecaoSkeleton altura="h-56" />
              <SecaoSkeleton altura="h-56" />
            </>
          }
        >
          <RankingsSecao resumoEDiaPromise={rankingsResumoEDiaPromise} />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { AcuraciaProjecaoPanel } from "@/modules/dashboard-vendas/components/acuracia-projecao-panel";
import { ResumoDoDiaSecao } from "@/modules/dashboard-vendas/components/secoes/resumo-do-dia-secao";
import { RankingsSecao } from "@/modules/dashboard-vendas/components/secoes/rankings-secao";
import { ProjecaoSecao } from "@/modules/dashboard-vendas/components/secoes/projecao-secao";
import { RecenciaECruzamentoSecao } from "@/modules/dashboard-vendas/components/secoes/recencia-e-cruzamento-secao";
import { ConversaoSecao } from "@/modules/dashboard-vendas/components/secoes/conversao-secao";
import { VendasMensaisSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-mensais-secao";
import { VendasDiariasSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-diarias-secao";
import { SecaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/secao-skeleton";
import type { DashboardVendasData } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

type MockEstatico = Pick<DashboardVendasData, "intraday" | "acuracia">;

interface DashboardVendasViewProps {
  mockEstatico: MockEstatico;
}

// Orquestra as seções na ordem da spec (4.1 → 4.11), com uma diferença
// deliberada: `recencia` e `cruzamentoCanais` (4.6 e 4.11 na spec) agora
// ficam lado a lado, porque streamam juntas — as duas dependem da mesma
// busca cara no SST (ver RecenciaECruzamentoSecao). O resto continua na
// ordem original.
//
// Carregamento progressivo: a página abre na hora, com TODA seção que
// depende do SST em placeholder (`Suspense`) — só `mockEstatico` chega
// pronto (puro mock em memória, sem I/O). `ResumoDoDiaSecao`/
// `RankingsSecao` chamam `obterResumoEDia` (memoizado por request via
// `cache()`, ver controller) de forma independente, sem duplicar a
// busca cara no SST.
export function DashboardVendasView({ mockEstatico }: DashboardVendasViewProps) {
  return (
    // "dashboard-vendas-scope" dá vida às vars --dv-* (ver
    // constants/dashboard-vendas.constants.ts + .dashboard-vendas-scope
    // em globals.css) — sem esta classe em algum ancestral, os
    // `var(--dv-*)` não resolvem e as cores somem.
    <div className="dashboard-vendas-scope flex flex-col gap-4">
      <Suspense
        fallback={
          <>
            <SecaoSkeleton altura="h-24" />
            <SecaoSkeleton altura="h-24" />
            <SecaoSkeleton altura="h-64" />
          </>
        }
      >
        <ResumoDoDiaSecao intraday={mockEstatico.intraday} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-72" />}>
        <ProjecaoSecao />
      </Suspense>

      <AcuraciaProjecaoPanel acuracia={mockEstatico.acuracia} />

      <Suspense fallback={<SecaoSkeleton altura="h-72" />}>
        <RecenciaECruzamentoSecao />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-48" />}>
        <ConversaoSecao />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasMensaisSecao />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasDiariasSecao />
      </Suspense>

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
          <RankingsSecao />
        </Suspense>
      </div>
    </div>
  );
}

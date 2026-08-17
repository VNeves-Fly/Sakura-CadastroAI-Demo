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
import { TopAgenciasCard } from "@/modules/dashboard-vendas/components/top-agencias-card";
import { TopFornecedoresCard } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import { NacionalInternacionalCard } from "@/modules/dashboard-vendas/components/nacional-internacional-card";
import { RecenciaECruzamentoSecao } from "@/modules/dashboard-vendas/components/secoes/recencia-e-cruzamento-secao";
import { ConversaoSecao } from "@/modules/dashboard-vendas/components/secoes/conversao-secao";
import { VendasMensaisSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-mensais-secao";
// import { VendasDiariasSecao } from "@/modules/dashboard-vendas/components/secoes/vendas-diarias-secao";
import { SecaoSkeleton } from "@/modules/dashboard-vendas/components/secoes/secao-skeleton";
import type { DashboardVendasData } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

type ResumoEDia = Pick<
  DashboardVendasData,
  | "resumoPorPeriodo"
  | "miniKpis"
  | "rankingPorMes"
  | "fornecedoresPorMes"
  | "nacionalInternacionalPorMes"
>;
type MockEstatico = Pick<DashboardVendasData, "intraday" | "projecao" | "acuracia">;

interface DashboardVendasViewProps {
  resumoEDia: ResumoEDia;
  mockEstatico: MockEstatico;
}

// Orquestra as seções na ordem da spec (4.1 → 4.11), com uma diferença
// deliberada: `recencia` e `cruzamentoCanais` (4.6 e 4.11 na spec) agora
// ficam lado a lado, porque streamam juntas — as duas dependem da mesma
// busca cara no SST (ver RecenciaECruzamentoSecao). O resto continua na
// ordem original.
//
// Carregamento progressivo: só `resumoEDia`/`mockEstatico` chegam prontos
// (rápidos, sem paginação) — as 4 seções pesadas (que fazem paginação de
// `/api/resumos/terrestre`) streamam via `Suspense`, cada uma assim que
// terminar, em vez de bloquear a página inteira nos ~30s do pior caso.
export function DashboardVendasView({ resumoEDia, mockEstatico }: DashboardVendasViewProps) {
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

      {/* "Vendas Diárias" oculta a pedido do usuário (2026-08-17) — ver
          comentário no import acima.
      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <VendasDiariasSecao />
      </Suspense>
      */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TopAgenciasCard rankingPorMes={resumoEDia.rankingPorMes} />
        <TopFornecedoresCard fornecedoresPorMes={resumoEDia.fornecedoresPorMes} />
        <NacionalInternacionalCard
          nacionalInternacionalPorMes={resumoEDia.nacionalInternacionalPorMes}
        />
      </div>
    </div>
  );
}

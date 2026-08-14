import { ResumoDoDiaCard } from "@/modules/dashboard-vendas/components/resumo-do-dia-card";
import { MiniKpisGrid } from "@/modules/dashboard-vendas/components/mini-kpis-grid";
import { VendasIntradayChart } from "@/modules/dashboard-vendas/components/vendas-intraday-chart";
import { ProjecaoDoDiaCard } from "@/modules/dashboard-vendas/components/projecao-do-dia-card";
import { AcuraciaProjecaoPanel } from "@/modules/dashboard-vendas/components/acuracia-projecao-panel";
import { RecenciaKpisGrid } from "@/modules/dashboard-vendas/components/recencia-kpis-grid";
import { ConversaoPanel } from "@/modules/dashboard-vendas/components/conversao-panel";
import { VendasMensaisChart } from "@/modules/dashboard-vendas/components/vendas-mensais-chart";
import { VendasDiariasChart } from "@/modules/dashboard-vendas/components/vendas-diarias-chart";
import { TopAgenciasCard } from "@/modules/dashboard-vendas/components/top-agencias-card";
import { TopFornecedoresCard } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import { NacionalInternacionalCard } from "@/modules/dashboard-vendas/components/nacional-internacional-card";
import { CruzamentoCanaisCard } from "@/modules/dashboard-vendas/components/cruzamento-canais-card";
import type { DashboardVendasData } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface DashboardVendasViewProps {
  dados: DashboardVendasData;
}

// Orquestra as seções na ordem exata da spec (4.1 → 4.11). Recebe os
// dados já adaptados prontos — zero regra de negócio aqui, só layout.
export function DashboardVendasView({ dados }: DashboardVendasViewProps) {
  return (
    // "dashboard-vendas-scope" dá vida às vars --dv-* (ver
    // constants/dashboard-vendas.constants.ts + .dashboard-vendas-scope
    // em globals.css) — sem esta classe em algum ancestral, os
    // `var(--dv-*)` não resolvem e as cores somem.
    <div className="dashboard-vendas-scope flex flex-col gap-4">
      <ResumoDoDiaCard resumoPorPeriodo={dados.resumoPorPeriodo} />
      <MiniKpisGrid {...dados.miniKpis} />
      <VendasIntradayChart
        intraday={dados.intraday}
        atualizadoEm={dados.resumoPorPeriodo.hoje.atualizadoEm}
      />
      <ProjecaoDoDiaCard projecao={dados.projecao} />
      <AcuraciaProjecaoPanel acuracia={dados.acuracia} />
      <RecenciaKpisGrid recencia={dados.recencia} recenciaDetalhe={dados.recenciaDetalhe} />
      <ConversaoPanel conversao={dados.conversao} />
      <VendasMensaisChart vendasMensais={dados.vendasMensais} />
      <VendasDiariasChart vendasDiarias={dados.vendasDiarias} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TopAgenciasCard rankingPorMes={dados.rankingPorMes} />
        <TopFornecedoresCard fornecedoresPorMes={dados.fornecedoresPorMes} />
        <NacionalInternacionalCard
          nacionalInternacionalPorMes={dados.nacionalInternacionalPorMes}
        />
      </div>

      <CruzamentoCanaisCard
        cruzamento={dados.cruzamentoCanais}
        cruzamentoDetalhe={dados.cruzamentoDetalhe}
      />
    </div>
  );
}

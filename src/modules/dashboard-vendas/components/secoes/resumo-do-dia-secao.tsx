import { ResumoDoDiaComMiniKpis } from "@/modules/dashboard-vendas/components/resumo-do-dia-com-mini-kpis";
// "Vendas Intraday" oculta a pedido do usuário (2026-08-18) — a
// disposição do dashboard passou a seguir só as seções do print de
// referência (SPEC_Dashboard_Sakura.md), que não inclui este gráfico.
// Import comentado junto pra não sobrar warning de unused-import; pra
// trazer de volta: descomentar aqui + o prop `intraday` abaixo + a
// leitura `intraday={mockEstatico.intraday}` em dashboard-vendas-view.tsx.
// import { VendasIntradayChart } from "@/modules/dashboard-vendas/components/vendas-intraday-chart";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface ResumoDoDiaSecaoProps {
  resumoEDiaPromise: ReturnType<typeof dashboardVendasController.obterResumoEDia>;
}

// Recebe a busca já disparada pelo pai (`DashboardVendasView`), não a
// dispara aqui — é o pai que decide a ordem/timing entre seções (ver
// comentário em dashboard-vendas-view.tsx).
export async function ResumoDoDiaSecao({ resumoEDiaPromise }: ResumoDoDiaSecaoProps) {
  const resumoEDia = await resumoEDiaPromise;
  return (
    <>
      <ResumoDoDiaComMiniKpis
        resumoPorPeriodo={resumoEDia.resumoPorPeriodo}
        miniKpisPorPeriodo={resumoEDia.miniKpis}
      />
      {/* <VendasIntradayChart intraday={intraday} atualizadoEm={resumoEDia.resumoPorPeriodo.hoje.atualizadoEm} /> */}
    </>
  );
}

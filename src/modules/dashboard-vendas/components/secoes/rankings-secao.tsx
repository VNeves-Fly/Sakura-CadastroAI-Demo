import { TopAgenciasCard } from "@/modules/dashboard-vendas/components/top-agencias-card";
import { TopFornecedoresCard } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import { NacionalInternacionalCard } from "@/modules/dashboard-vendas/components/nacional-internacional-card";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface RankingsSecaoProps {
  resumoEDiaPromise: ReturnType<typeof dashboardVendasController.obterResumoEDia>;
}

// Recebe a mesma busca de `ResumoDoDiaSecao` (memoizada por request via
// `cache()`, ver controller), mas encadeada depois das demais seções —
// ver comentário em dashboard-vendas-view.tsx sobre a ordem de abertura.
export async function RankingsSecao({ resumoEDiaPromise }: RankingsSecaoProps) {
  const resumoEDia = await resumoEDiaPromise;
  return (
    <>
      <TopAgenciasCard rankingPorMes={resumoEDia.rankingPorMes} />
      <TopFornecedoresCard fornecedoresPorMes={resumoEDia.fornecedoresPorMes} />
      <NacionalInternacionalCard
        nacionalInternacionalPorMes={resumoEDia.nacionalInternacionalPorMes}
      />
    </>
  );
}

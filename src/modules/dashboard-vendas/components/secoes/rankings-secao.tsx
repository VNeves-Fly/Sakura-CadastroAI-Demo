import { TopAgenciasCard } from "@/modules/dashboard-vendas/components/top-agencias-card";
import { TopFornecedoresCard } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface RankingsSecaoProps {
  resumoEDiaPromise: ReturnType<typeof dashboardVendasController.obterResumoEDia>;
}

// Recebe a mesma busca de `ResumoDoDiaSecao` (memoizada por request via
// `cache()`, ver controller), mas encadeada depois das demais seções —
// ver comentário em dashboard-vendas-view.tsx sobre a ordem de abertura.
// "Nacional vs Internacional" saiu daqui (pedido do usuário, 2026-08-19)
// — a tela agora divide só entre Top 10 Agências e Top 10 Fornecedores.
export async function RankingsSecao({ resumoEDiaPromise }: RankingsSecaoProps) {
  const resumoEDia = await resumoEDiaPromise;
  return (
    <>
      <TopAgenciasCard rankingPorPeriodo={resumoEDia.rankingPorPeriodo} />
      <TopFornecedoresCard fornecedoresPorPeriodo={resumoEDia.fornecedoresPorPeriodo} />
    </>
  );
}

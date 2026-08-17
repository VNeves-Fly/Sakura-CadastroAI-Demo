import { TopAgenciasCard } from "@/modules/dashboard-vendas/components/top-agencias-card";
import { TopFornecedoresCard } from "@/modules/dashboard-vendas/components/top-fornecedores-card";
import { NacionalInternacionalCard } from "@/modules/dashboard-vendas/components/nacional-internacional-card";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

export async function RankingsSecao() {
  const resumoEDia = await dashboardVendasController.obterResumoEDia();
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

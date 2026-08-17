import { RecenciaKpisGrid } from "@/modules/dashboard-vendas/components/recencia-kpis-grid";
import { CruzamentoCanaisCard } from "@/modules/dashboard-vendas/components/cruzamento-canais-card";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

// Streamadas juntas (mesmo `Suspense`, ver dashboard-vendas-view.tsx)
// porque as duas seções compartilham a mesma busca cara no SST
// (`obterRecenciaECruzamento`, paginação de `/api/resumos/terrestre`) —
// separar em dois `Suspense` disparava a mesma paginação duas vezes.
export async function RecenciaECruzamentoSecao() {
  const dados = await dashboardVendasController.obterRecenciaECruzamento();
  return (
    <>
      <RecenciaKpisGrid recencia={dados.recencia} recenciaDetalhe={dados.recenciaDetalhe} />
      <CruzamentoCanaisCard
        cruzamento={dados.cruzamentoCanais}
        cruzamentoDetalhe={dados.cruzamentoDetalhe}
      />
    </>
  );
}

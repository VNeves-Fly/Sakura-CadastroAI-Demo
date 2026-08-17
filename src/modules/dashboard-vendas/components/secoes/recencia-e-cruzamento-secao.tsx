import { RecenciaKpisGrid } from "@/modules/dashboard-vendas/components/recencia-kpis-grid";
import { CruzamentoCanaisCard } from "@/modules/dashboard-vendas/components/cruzamento-canais-card";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface RecenciaECruzamentoSecaoProps {
  recenciaECruzamentoPromise: ReturnType<typeof dashboardVendasController.obterRecenciaECruzamento>;
}

// Streamadas juntas (mesmo `Suspense`, ver dashboard-vendas-view.tsx)
// porque as duas seções compartilham a mesma busca cara no SST
// (`obterRecenciaECruzamento`, paginação de `/api/resumos/terrestre`) —
// separar em dois `Suspense` disparava a mesma paginação duas vezes.
// Recebe a busca já disparada pelo pai — ver comentário em
// resumo-do-dia-secao.tsx.
export async function RecenciaECruzamentoSecao({
  recenciaECruzamentoPromise,
}: RecenciaECruzamentoSecaoProps) {
  const dados = await recenciaECruzamentoPromise;
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

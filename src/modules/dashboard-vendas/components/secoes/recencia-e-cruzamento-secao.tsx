import { RecenciaKpisGrid } from "@/modules/dashboard-vendas/components/recencia-kpis-grid";
// "Cruzamento Aéreo x Terrestre" oculto a pedido do usuário (2026-08-18)
// — não aparece no print de referência (SPEC_Dashboard_Sakura.md).
// Import comentado junto pra não sobrar warning de unused-import; é só
// descomentar (aqui + o bloco JSX abaixo) pra trazer de volta. A busca
// no SST continua trazendo `cruzamentoCanais`/`cruzamentoDetalhe` junto
// com `recencia` (mesma chamada cara, ver comentário abaixo) — não dá
// pra cortar só essa metade sem tocar no back-end, então só a
// renderização foi removida.
// import { CruzamentoCanaisCard } from "@/modules/dashboard-vendas/components/cruzamento-canais-card";
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
      {/* <CruzamentoCanaisCard cruzamento={dados.cruzamentoCanais} cruzamentoDetalhe={dados.cruzamentoDetalhe} /> */}
    </>
  );
}

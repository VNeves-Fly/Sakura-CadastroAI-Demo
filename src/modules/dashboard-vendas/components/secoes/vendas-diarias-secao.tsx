import { VendasDiariasChart } from "@/modules/dashboard-vendas/components/vendas-diarias-chart";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface VendasDiariasSecaoProps {
  vendasDiariasPromise: ReturnType<typeof dashboardVendasController.obterVendasDiarias>;
}

// Recebe a busca já disparada pelo pai — ver comentário em
// resumo-do-dia-secao.tsx.
export async function VendasDiariasSecao({ vendasDiariasPromise }: VendasDiariasSecaoProps) {
  const vendasDiarias = await vendasDiariasPromise;
  return <VendasDiariasChart vendasDiarias={vendasDiarias} />;
}

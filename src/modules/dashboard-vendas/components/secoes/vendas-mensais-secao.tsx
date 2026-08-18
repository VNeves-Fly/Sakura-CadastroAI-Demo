import { VendasMensaisChart } from "@/modules/dashboard-vendas/components/vendas-mensais-chart";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface VendasMensaisSecaoProps {
  vendasMensaisPromise: ReturnType<typeof dashboardVendasController.obterVendasMensais>;
}

// Recebe a busca já disparada pelo pai — ver comentário em
// resumo-do-dia-secao.tsx.
export async function VendasMensaisSecao({ vendasMensaisPromise }: VendasMensaisSecaoProps) {
  const vendasMensais = await vendasMensaisPromise;
  return <VendasMensaisChart vendasMensais={vendasMensais} />;
}

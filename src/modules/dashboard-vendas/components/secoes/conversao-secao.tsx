import { ConversaoPanel } from "@/modules/dashboard-vendas/components/conversao-panel";
import type { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";

interface ConversaoSecaoProps {
  conversaoPromise: ReturnType<typeof dashboardVendasController.obterConversao>;
}

// Recebe a busca já disparada pelo pai — ver comentário em
// resumo-do-dia-secao.tsx.
export async function ConversaoSecao({ conversaoPromise }: ConversaoSecaoProps) {
  const conversao = await conversaoPromise;
  return <ConversaoPanel conversao={conversao} />;
}

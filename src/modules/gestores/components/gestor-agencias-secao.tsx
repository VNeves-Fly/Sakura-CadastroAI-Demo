import { GestorAgenciasTab } from "@/modules/gestores/components/gestor-agencias-tab";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgenciasSecaoProps {
  executivos: ExecutivoComCarteira[];
  agregadoPromise: ReturnType<typeof gestorDashboardController.obterAgregadoCompleto>;
}

// Recebe a busca já disparada pelo pai (GestorAgenciasView), não a dispara
// aqui — mesmo padrão de gestor-executivos-secao.tsx.
export async function GestorAgenciasSecao({
  executivos,
  agregadoPromise,
}: GestorAgenciasSecaoProps) {
  const agregado = await agregadoPromise;
  return <GestorAgenciasTab executivos={executivos} porExecutivo={agregado.porExecutivo} />;
}

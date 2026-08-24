import { gestorExecutivosTabAdapter } from "@/modules/gestores/adapters/gestor-executivos-tab.adapter";
import { GestorExecutivosTab } from "@/modules/gestores/components/gestor-executivos-tab";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorExecutivosSecaoProps {
  executivosBase: ExecutivoComCarteira[];
  agregadoPromise: ReturnType<typeof gestorDashboardController.obterAgregadoCompleto>;
}

// Recebe a busca já disparada pelo pai (GestorExecutivosView), não a
// dispara aqui — mesmo padrão de gestor-hero-kpis-secao.tsx. Isola o
// `await` pesado (SST por executivo) dentro do Suspense, deixando o shell
// (header + tabs) renderizar na hora do clique.
export async function GestorExecutivosSecao({
  executivosBase,
  agregadoPromise,
}: GestorExecutivosSecaoProps) {
  const agregado = await agregadoPromise;
  const executivos = gestorExecutivosTabAdapter.toViewList(executivosBase, agregado.porExecutivo);
  return <GestorExecutivosTab executivos={executivos} />;
}

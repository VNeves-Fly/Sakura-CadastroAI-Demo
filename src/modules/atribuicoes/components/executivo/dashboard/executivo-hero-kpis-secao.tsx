import { ReceitaTotalCard } from "@/modules/atribuicoes/components/executivo/dashboard/receita-total-card";
import { KpisSecundariosGrid } from "@/modules/atribuicoes/components/executivo/dashboard/kpis-secundarios";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof executivoDashboardController.obterHeroKpis>;
  perfilId: string;
  vendendo30d: number;
  vendendo30dPct: number;
}

// Recebe a busca já disparada pelo pai (ExecutivoDashboardView), não a
// dispara aqui — mesmo padrão de dashboard-vendas/components/secoes.
export async function ExecutivoHeroKpisSecao({
  heroKpisPromise,
  perfilId,
  vendendo30d,
  vendendo30dPct,
}: ExecutivoHeroKpisSecaoProps) {
  const { hero, kpis } = await heroKpisPromise;
  return (
    <>
      <ReceitaTotalCard hero={hero} perfilId={perfilId} />
      <KpisSecundariosGrid kpis={kpis} vendendo30d={vendendo30d} vendendo30dPct={vendendo30dPct} />
    </>
  );
}

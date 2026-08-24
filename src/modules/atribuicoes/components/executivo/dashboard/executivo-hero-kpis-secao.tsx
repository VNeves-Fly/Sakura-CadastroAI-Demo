import { ReceitaTotalCard } from "@/modules/atribuicoes/components/executivo/dashboard/receita-total-card";
import { KpisSecundariosGrid } from "@/modules/atribuicoes/components/executivo/dashboard/kpis-secundarios";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof executivoDashboardController.obterHeroKpis>;
  perfilId: string;
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// Recebe as buscas já disparadas pelo pai (ExecutivoDashboardView), não
// as dispara aqui — mesmo padrão de dashboard-vendas/components/secoes.
// Só `heroKpisPromise` é aguardada aqui; `crossCanalPromise` é só
// repassada pra `KpisSecundariosGrid`, que a resolve no seu próprio
// Suspense interno (card "Vendendo 30d") sem atrasar esta seção.
export async function ExecutivoHeroKpisSecao({
  heroKpisPromise,
  perfilId,
  crossCanalPromise,
}: ExecutivoHeroKpisSecaoProps) {
  const { hero, kpis } = await heroKpisPromise;
  return (
    <>
      <ReceitaTotalCard hero={hero} perfilId={perfilId} />
      <KpisSecundariosGrid kpis={kpis} crossCanalPromise={crossCanalPromise} />
    </>
  );
}

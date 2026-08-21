import { VendasMesHeroCard } from "@/modules/atribuicoes/components/executivo/dashboard/vendas-mes-hero-card";
import { KpisSecundariosGrid } from "@/modules/atribuicoes/components/executivo/dashboard/kpis-secundarios";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof executivoDashboardController.obterHeroKpis>;
}

// Recebe a busca já disparada pelo pai (ExecutivoDashboardView), não a
// dispara aqui — mesmo padrão de dashboard-vendas/components/secoes.
export async function ExecutivoHeroKpisSecao({ heroKpisPromise }: ExecutivoHeroKpisSecaoProps) {
  const { hero, kpis } = await heroKpisPromise;
  return (
    <>
      <VendasMesHeroCard hero={hero} />
      <KpisSecundariosGrid kpis={kpis} />
    </>
  );
}

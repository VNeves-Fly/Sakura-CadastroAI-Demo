import { GestorReceitaTotalCard } from "@/modules/gestores/components/dashboard/gestor-receita-total-card";
import { GestorKpisSecundariosGrid } from "@/modules/gestores/components/dashboard/gestor-kpis-secundarios";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";

interface GestorHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof gestorDashboardController.obterHeroKpisAgregado>;
  crossCanalPromise: ReturnType<typeof gestorDashboardController.obterCrossCanalAgregado>;
  atualizadoEm: string;
}

// Recebe as buscas já disparadas pelo pai (GestorDashboardView), não as
// dispara aqui — mesmo padrão de executivo-hero-kpis-secao.tsx. Só
// `heroKpisPromise` é aguardada aqui; `crossCanalPromise` é só repassada
// pra `GestorKpisSecundariosGrid`, que a resolve no seu próprio Suspense
// interno (card "Vendendo 30d") sem atrasar esta seção.
export async function GestorHeroKpisSecao({
  heroKpisPromise,
  crossCanalPromise,
  atualizadoEm,
}: GestorHeroKpisSecaoProps) {
  const { hero, kpis, margemRentab } = await heroKpisPromise;
  return (
    <>
      <GestorReceitaTotalCard hero={hero} margemRentab={margemRentab} atualizadoEm={atualizadoEm} />
      <GestorKpisSecundariosGrid kpis={kpis} crossCanalPromise={crossCanalPromise} />
    </>
  );
}

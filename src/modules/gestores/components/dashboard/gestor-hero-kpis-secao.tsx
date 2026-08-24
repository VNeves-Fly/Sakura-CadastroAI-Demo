import { GestorReceitaTotalCard } from "@/modules/gestores/components/dashboard/gestor-receita-total-card";
import { GestorKpisSecundariosGrid } from "@/modules/gestores/components/dashboard/gestor-kpis-secundarios";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import type { CanalResumoGestor } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof gestorDashboardController.obterHeroKpisAgregado>;
  canalAereo: CanalResumoGestor;
  canalTerrestre: CanalResumoGestor;
  atualizadoEm: string;
}

// Recebe a busca já disparada pelo pai (GestorDashboardView), não a
// dispara aqui — mesmo padrão de executivo-hero-kpis-secao.tsx.
export async function GestorHeroKpisSecao({
  heroKpisPromise,
  canalAereo,
  canalTerrestre,
  atualizadoEm,
}: GestorHeroKpisSecaoProps) {
  const { hero, kpis } = await heroKpisPromise;
  return (
    <>
      <GestorReceitaTotalCard
        hero={hero}
        canalAereo={canalAereo}
        canalTerrestre={canalTerrestre}
        atualizadoEm={atualizadoEm}
      />
      <GestorKpisSecundariosGrid kpis={kpis} />
    </>
  );
}

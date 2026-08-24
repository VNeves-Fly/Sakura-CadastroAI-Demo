import { GestorReceitaTotalCard } from "@/modules/gestores/components/dashboard/gestor-receita-total-card";
import { GestorKpisSecundariosGrid } from "@/modules/gestores/components/dashboard/gestor-kpis-secundarios";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";

interface GestorHeroKpisSecaoProps {
  heroKpisPromise: ReturnType<typeof gestorDashboardController.obterHeroKpisAgregado>;
  atualizadoEm: string;
}

// Recebe a busca já disparada pelo pai (GestorDashboardView), não a
// dispara aqui — mesmo padrão de executivo-hero-kpis-secao.tsx.
export async function GestorHeroKpisSecao({
  heroKpisPromise,
  atualizadoEm,
}: GestorHeroKpisSecaoProps) {
  const { hero, kpis, margemRentab } = await heroKpisPromise;
  return (
    <>
      <GestorReceitaTotalCard hero={hero} margemRentab={margemRentab} atualizadoEm={atualizadoEm} />
      <GestorKpisSecundariosGrid kpis={kpis} />
    </>
  );
}

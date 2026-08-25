import { GestoresView } from "@/modules/gestores/views/gestores-view";
import type { VendasPorGestor } from "@/modules/gestores/services/vendas-por-gestor.loader";
import type { BaseView } from "@/modules/bases/types/base.types";

interface GestoresListaSecaoProps {
  basesOptions: BaseView[];
  executivosPorGestor: Record<string, number>;
  vendasPorGestorPromise: Promise<VendasPorGestor>;
}

// Server Component async — page.tsx dispara calcularVendasPorGestor() sem
// `await` e passa a promise pra cá dentro de um <Suspense>; só este
// componente espera o SST resolver, então o Suspense troca o skeleton
// (GestoresListaSkeleton) pelo GestoresView real assim que as vendas
// terminarem de carregar, sem bloquear título/toolbar/tabela por causa de
// uma coluna só.
export async function GestoresListaSecao({
  basesOptions,
  executivosPorGestor,
  vendasPorGestorPromise,
}: GestoresListaSecaoProps) {
  const vendasPorGestor = await vendasPorGestorPromise;
  return (
    <GestoresView
      basesOptions={basesOptions}
      executivosPorGestor={executivosPorGestor}
      vendasPorGestor={vendasPorGestor}
    />
  );
}

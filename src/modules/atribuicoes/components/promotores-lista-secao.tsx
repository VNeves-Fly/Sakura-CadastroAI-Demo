import { PromotoresView } from "@/modules/atribuicoes/views/promotores-view";
import { promotoresCrudAdapter } from "@/modules/atribuicoes/adapters/promotores-crud.adapter";
import type { VendasPorExecutivo } from "@/modules/atribuicoes/services/vendas-por-executivos.loader";
import type { RawPromotorResponse } from "@/modules/atribuicoes/services/promotores-crud.service";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type { BaseView } from "@/modules/bases/types/base.types";

interface PromotoresListaSecaoProps {
  promotores: Promotor[];
  gestoresOptions: GestorOpcao[];
  criacaoGestoresOptions: GestorOpcao[] | null;
  minhasBasesSiglas?: string[];
  todasBases: BaseView[];
  vendasPorExecutivoPromise: Promise<VendasPorExecutivo>;
}

// Server Component async — page.tsx dispara calcularVendasPorExecutivos()
// sem `await` e passa a promise pra cá dentro de um <Suspense>; só este
// componente espera o SST resolver, então o Suspense troca o skeleton
// (PromotoresListaSkeleton) pelo PromotoresView real assim que as vendas
// terminarem de carregar — mesmo padrão de gestores-lista-secao.tsx.
export async function PromotoresListaSecao({
  promotores,
  gestoresOptions,
  criacaoGestoresOptions,
  minhasBasesSiglas,
  todasBases,
  vendasPorExecutivoPromise,
}: PromotoresListaSecaoProps) {
  const vendasPorExecutivo = await vendasPorExecutivoPromise;

  // Monta o mesmo shape que GET /api/promotores já devolve (RawPromotorResponse
  // com vendasMes/vendasAno embutidos, ver comVendasReais em
  // promotores.routes.ts) e reaproveita o adapter client existente — evita
  // divergência entre este caminho (SSR) e o caminho de fetch client que
  // usePromotoresListViewModel ainda usa pra reload/mutações.
  const raw: RawPromotorResponse[] = promotores.map((promotor) => ({
    ...promotor.toJSON(),
    ...(vendasPorExecutivo[promotor.id] ?? { vendasMes: 0, vendasAno: 0 }),
  }));
  const initialExecutivos = promotoresCrudAdapter.toViewList(raw);

  return (
    <PromotoresView
      gestoresOptions={gestoresOptions}
      criacaoGestoresOptions={criacaoGestoresOptions}
      minhasBasesSiglas={minhasBasesSiglas}
      todasBases={todasBases}
      initialExecutivos={initialExecutivos}
    />
  );
}

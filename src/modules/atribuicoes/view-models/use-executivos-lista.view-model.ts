"use client";

import { useMemo, useState } from "react";
import { usePromotoresListViewModel } from "@/modules/atribuicoes/view-models/use-promotores-list.view-model";
import { promotorListaAdapter } from "@/modules/atribuicoes/adapters/promotor-lista.adapter";
import type {
  GestorOpcao,
  PromotorCrudView,
} from "@/modules/atribuicoes/types/promotor-crud.types";
import {
  TAMANHO_PAGINA_EXECUTIVOS,
  type PromotorListaFiltros,
} from "@/modules/atribuicoes/types/promotor-lista.types";

// Defaults não confirmados na SPEC pra "Esconder INATIVO"/"Ocultar sem
// vendas" — mantidos desligados até validar com o time de negócio, pra
// não esconder dado nenhum sem essa confirmação.
const FILTROS_INICIAIS: PromotorListaFiltros = {
  busca: "",
  esconderInativo: false,
  ocultarSemVendas: false,
};

export function useExecutivosListaViewModel(
  gestoresOptions: GestorOpcao[] | null,
  initialExecutivos?: PromotorCrudView[],
) {
  const { promotores, isLoading, error } = usePromotoresListViewModel(initialExecutivos);
  const [filtros, setFiltros] = useState<PromotorListaFiltros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);

  const executivos = useMemo(
    () => promotorListaAdapter.toListaViewList(promotores, gestoresOptions),
    [promotores, gestoresOptions],
  );

  const executivosFiltrados = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();

    return executivos.filter((executivo) => {
      if (filtros.esconderInativo && executivo.semVinculo) return false;
      if (filtros.ocultarSemVendas && executivo.semVenda) return false;
      if (buscaNormalizada && !executivo.nome.toLowerCase().includes(buscaNormalizada)) {
        return false;
      }
      return true;
    });
  }, [executivos, filtros]);

  function atualizarFiltro<K extends keyof PromotorListaFiltros>(
    chave: K,
    valor: PromotorListaFiltros[K],
  ) {
    setFiltros((atual) => ({ ...atual, [chave]: valor }));
    setPagina(1);
  }

  // Paginação client-side, 25 por página (pedido do usuário, 2026-08-19)
  // — mesmo padrão de use-agencias-carteira.view-model.ts. `paginaAtual`
  // reencaixa pra última página válida se um filtro reduzir o total
  // enquanto o usuário está numa página que deixou de existir.
  const totalPaginas = Math.max(
    1,
    Math.ceil(executivosFiltrados.length / TAMANHO_PAGINA_EXECUTIVOS),
  );
  const paginaAtual = Math.min(pagina, totalPaginas);
  const executivosDaPagina = executivosFiltrados.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA_EXECUTIVOS,
    paginaAtual * TAMANHO_PAGINA_EXECUTIVOS,
  );

  return {
    executivos: executivosDaPagina,
    total: executivosFiltrados.length,
    isLoading,
    error,
    filtros,
    atualizarFiltro,
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
  };
}

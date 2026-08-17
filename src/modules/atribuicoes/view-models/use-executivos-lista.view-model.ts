"use client";

import { useMemo, useState } from "react";
import { usePromotoresListViewModel } from "@/modules/atribuicoes/view-models/use-promotores-list.view-model";
import { promotorListaAdapter } from "@/modules/atribuicoes/adapters/promotor-lista.adapter";
import type { GestorOpcao } from "@/modules/atribuicoes/types/promotor-crud.types";
import type { PromotorListaFiltros } from "@/modules/atribuicoes/types/promotor-lista.types";

// Defaults não confirmados na SPEC pra "Esconder INATIVO"/"Ocultar sem
// vendas" — mantidos desligados até validar com o time de negócio, pra
// não esconder dado nenhum sem essa confirmação.
const FILTROS_INICIAIS: PromotorListaFiltros = {
  busca: "",
  esconderInativo: false,
  ocultarSemVendas: false,
};

export function useExecutivosListaViewModel(gestoresOptions: GestorOpcao[] | null) {
  const { promotores, isLoading, error } = usePromotoresListViewModel();
  const [filtros, setFiltros] = useState<PromotorListaFiltros>(FILTROS_INICIAIS);

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
  }

  return {
    executivos: executivosFiltrados,
    total: executivosFiltrados.length,
    isLoading,
    error,
    filtros,
    atualizarFiltro,
  };
}

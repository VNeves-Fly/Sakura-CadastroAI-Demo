"use client";

import { useMemo, useState } from "react";
import { useGestoresListViewModel } from "@/modules/gestores/view-models/use-gestores-list.view-model";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { useGestorStatusStore } from "@/modules/gestores/stores/gestor-status.store";
import { gestorListaAdapter } from "@/modules/gestores/adapters/gestor-lista.adapter";
import type { GestorListaFiltros } from "@/modules/gestores/types/gestor-lista.types";

const FILTROS_INICIAIS: GestorListaFiltros = { busca: "" };

export function useGestoresListaViewModel(executivosPorGestor: Record<string, number>) {
  const { gestores, isLoading, error } = useGestoresListViewModel();
  const nivelOverrides = useGestorNiveisStore((state) => state.overrides);
  const ativoOverrides = useGestorStatusStore((state) => state.overrides);
  const [filtros, setFiltros] = useState<GestorListaFiltros>(FILTROS_INICIAIS);

  const gestoresView = useMemo(
    () =>
      gestorListaAdapter.toListaViewList(
        gestores,
        executivosPorGestor,
        nivelOverrides,
        ativoOverrides,
      ),
    [gestores, executivosPorGestor, nivelOverrides, ativoOverrides],
  );

  const gestoresFiltrados = useMemo(() => {
    const buscaNormalizada = filtros.busca.trim().toLowerCase();
    if (!buscaNormalizada) return gestoresView;
    return gestoresView.filter((gestor) => gestor.nome.toLowerCase().includes(buscaNormalizada));
  }, [gestoresView, filtros]);

  return {
    gestores: gestoresFiltrados,
    total: gestoresFiltrados.length,
    isLoading,
    error,
    busca: filtros.busca,
    atualizarBusca: (valor: string) => setFiltros({ busca: valor }),
    // Botão Inativar/Ativar da lista — grava só no override local (ver
    // gestor-status.store.ts), sem chamada à API.
    alternarAtivo: (gestorId: string, ativo: boolean) =>
      useGestorStatusStore.getState().definirAtivo(gestorId, ativo),
  };
}

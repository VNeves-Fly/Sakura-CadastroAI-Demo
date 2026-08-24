"use client";

import { useMemo, useState } from "react";
import { useGestoresListViewModel } from "@/modules/gestores/view-models/use-gestores-list.view-model";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { useGestorStatusStore } from "@/modules/gestores/stores/gestor-status.store";
import { gestorListaAdapter } from "@/modules/gestores/adapters/gestor-lista.adapter";
import {
  TAMANHO_PAGINA_GESTORES,
  type GestorListaFiltros,
} from "@/modules/gestores/types/gestor-lista.types";

const FILTROS_INICIAIS: GestorListaFiltros = { busca: "" };

export function useGestoresListaViewModel(executivosPorGestor: Record<string, number>) {
  const { gestores, isLoading, error } = useGestoresListViewModel();
  const nivelOverrides = useGestorNiveisStore((state) => state.overrides);
  const ativoOverrides = useGestorStatusStore((state) => state.overrides);
  const [filtros, setFiltros] = useState<GestorListaFiltros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);

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

  // Paginação client-side, 25 por página (mesmo padrão de
  // useExecutivosListaViewModel) — `paginaAtual` reencaixa pra última
  // página válida se a busca reduzir o total enquanto o usuário está numa
  // página que deixou de existir.
  const totalPaginas = Math.max(1, Math.ceil(gestoresFiltrados.length / TAMANHO_PAGINA_GESTORES));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const gestoresDaPagina = gestoresFiltrados.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA_GESTORES,
    paginaAtual * TAMANHO_PAGINA_GESTORES,
  );

  return {
    gestores: gestoresDaPagina,
    total: gestoresFiltrados.length,
    isLoading,
    error,
    busca: filtros.busca,
    atualizarBusca: (valor: string) => {
      setFiltros({ busca: valor });
      setPagina(1);
    },
    pagina: paginaAtual,
    totalPaginas,
    setPagina,
    // Botão Inativar/Ativar da lista — grava só no override local (ver
    // gestor-status.store.ts), sem chamada à API.
    alternarAtivo: (gestorId: string, ativo: boolean) =>
      useGestorStatusStore.getState().definirAtivo(gestorId, ativo),
  };
}

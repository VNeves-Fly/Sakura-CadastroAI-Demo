"use client";

import { useMemo, useState } from "react";
import { useGestoresListViewModel } from "@/modules/gestores/view-models/use-gestores-list.view-model";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { gestorListaAdapter } from "@/modules/gestores/adapters/gestor-lista.adapter";
import {
  TAMANHO_PAGINA_GESTORES,
  type GestorListaFiltros,
} from "@/modules/gestores/types/gestor-lista.types";
import type { RawGestorResponse } from "@/modules/gestores/services/gestores.service";

const FILTROS_INICIAIS: GestorListaFiltros = { busca: "" };

export function useGestoresListaViewModel(
  executivosPorGestor: Record<string, number>,
  vendasPorGestor: Record<string, { vendasMes: number; vendasAno: number }>,
  initialGestores?: RawGestorResponse[],
) {
  const { gestores, isLoading, error } = useGestoresListViewModel(initialGestores);
  const nivelOverrides = useGestorNiveisStore((state) => state.overrides);
  const [filtros, setFiltros] = useState<GestorListaFiltros>(FILTROS_INICIAIS);
  const [pagina, setPagina] = useState(1);

  const gestoresView = useMemo(
    () =>
      gestorListaAdapter.toListaViewList(
        gestores,
        executivosPorGestor,
        vendasPorGestor,
        nivelOverrides,
      ),
    [gestores, executivosPorGestor, vendasPorGestor, nivelOverrides],
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
  };
}

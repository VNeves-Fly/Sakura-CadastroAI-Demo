"use client";

import { useCallback, useEffect } from "react";
import { useAssociacoesStore } from "@/modules/associacoes/stores/associacoes.store";
import { associacoesAdapter } from "@/modules/associacoes/adapters/associacoes.adapter";
import { associacoesService } from "@/modules/associacoes/services/associacoes.service";

export function useAssociacoesListViewModel() {
  const associacoes = useAssociacoesStore((state) => state.associacoes);
  const isLoading = useAssociacoesStore((state) => state.isLoading);
  const error = useAssociacoesStore((state) => state.error);
  const setAssociacoes = useAssociacoesStore((state) => state.setAssociacoes);
  const setLoading = useAssociacoesStore((state) => state.setLoading);
  const setError = useAssociacoesStore((state) => state.setError);

  const loadAssociacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await associacoesService.list();
      setAssociacoes(associacoesAdapter.toViewList(raw));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setAssociacoes]);

  useEffect(() => {
    void loadAssociacoes();
  }, [loadAssociacoes]);

  return { associacoes, isLoading, error, reload: loadAssociacoes };
}

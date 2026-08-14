"use client";

import { useCallback, useEffect } from "react";
import { usePromotoresCrudStore } from "@/modules/atribuicoes/stores/promotores-crud.store";
import { promotoresCrudAdapter } from "@/modules/atribuicoes/adapters/promotores-crud.adapter";
import { promotoresCrudService } from "@/modules/atribuicoes/services/promotores-crud.service";

export function usePromotoresListViewModel() {
  const promotores = usePromotoresCrudStore((state) => state.promotores);
  const isLoading = usePromotoresCrudStore((state) => state.isLoading);
  const error = usePromotoresCrudStore((state) => state.error);
  const setPromotores = usePromotoresCrudStore((state) => state.setPromotores);
  const setLoading = usePromotoresCrudStore((state) => state.setLoading);
  const setError = usePromotoresCrudStore((state) => state.setError);

  const loadPromotores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await promotoresCrudService.list();
      setPromotores(promotoresCrudAdapter.toViewList(raw));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setPromotores]);

  useEffect(() => {
    void loadPromotores();
  }, [loadPromotores]);

  return { promotores, isLoading, error, reload: loadPromotores };
}

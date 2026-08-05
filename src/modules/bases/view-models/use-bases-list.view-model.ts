"use client";

import { useCallback, useEffect } from "react";
import { useBasesStore } from "@/modules/bases/stores/bases.store";
import { basesAdapter } from "@/modules/bases/adapters/bases.adapter";
import { basesService } from "@/modules/bases/services/bases.service";

export function useBasesListViewModel() {
  const bases = useBasesStore((state) => state.bases);
  const isLoading = useBasesStore((state) => state.isLoading);
  const error = useBasesStore((state) => state.error);
  const setBases = useBasesStore((state) => state.setBases);
  const setLoading = useBasesStore((state) => state.setLoading);
  const setError = useBasesStore((state) => state.setError);

  const loadBases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await basesService.list();
      setBases(basesAdapter.toViewList(raw));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setBases]);

  useEffect(() => {
    void loadBases();
  }, [loadBases]);

  return { bases, isLoading, error, reload: loadBases };
}

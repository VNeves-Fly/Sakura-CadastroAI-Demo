"use client";

import { useCallback, useEffect } from "react";
import { useGestoresStore } from "@/modules/gestores/stores/gestores.store";
import { gestoresAdapter } from "@/modules/gestores/adapters/gestores.adapter";
import { gestoresService } from "@/modules/gestores/services/gestores.service";

export function useGestoresListViewModel() {
  const gestores = useGestoresStore((state) => state.gestores);
  const isLoading = useGestoresStore((state) => state.isLoading);
  const error = useGestoresStore((state) => state.error);
  const setGestores = useGestoresStore((state) => state.setGestores);
  const setLoading = useGestoresStore((state) => state.setLoading);
  const setError = useGestoresStore((state) => state.setError);

  const loadGestores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await gestoresService.list();
      setGestores(gestoresAdapter.toViewList(raw));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setGestores]);

  useEffect(() => {
    void loadGestores();
  }, [loadGestores]);

  return { gestores, isLoading, error, reload: loadGestores };
}

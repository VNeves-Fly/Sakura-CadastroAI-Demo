"use client";

import { useCallback, useEffect, useState } from "react";
import { useGestoresStore } from "@/modules/gestores/stores/gestores.store";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { gestoresAdapter } from "@/modules/gestores/adapters/gestores.adapter";
import { gestoresService } from "@/modules/gestores/services/gestores.service";
import type {
  CreatedGestorResult,
  GestorFormValues,
  GestorView,
} from "@/modules/gestores/types/gestor.types";

export function useUpdateGestorViewModel(id: string) {
  const updateGestorNaStore = useGestoresStore((state) => state.updateGestor);
  const [gestor, setGestor] = useState<GestorView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedGestorResult | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const raw = await gestoresService.getById(id);
      setGestor(gestoresAdapter.toView(raw));
    } catch (caughtError) {
      setLoadError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(values: GestorFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const serviceInput = gestoresAdapter.toServiceInput(values);
      const raw = await gestoresService.update(id, serviceInput);
      const updated = gestoresAdapter.toCreatedResult(raw);
      setGestor(updated.gestor);
      updateGestorNaStore(updated.gestor);
      // Nível não existe no backend (ver gestor-nivel.types.ts) — grava só
      // no override local.
      if (values.nivel) {
        useGestorNiveisStore.getState().definirNivel(id, values.nivel);
      }
      setResult(updated);
      return true;
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    gestor,
    isLoading,
    loadError,
    isSubmitting,
    submitError,
    submit,
    result,
    dismissResult: () => setResult(null),
  };
}

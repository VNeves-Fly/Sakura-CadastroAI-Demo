"use client";

import { useState } from "react";
import { useGestoresStore } from "@/modules/gestores/stores/gestores.store";
import { useGestorNiveisStore } from "@/modules/gestores/stores/gestor-niveis.store";
import { gestoresAdapter } from "@/modules/gestores/adapters/gestores.adapter";
import { gestoresService } from "@/modules/gestores/services/gestores.service";
import type { GestorFormValues } from "@/modules/gestores/types/gestor.types";

export function useCreateGestorViewModel() {
  const addGestor = useGestoresStore((state) => state.addGestor);
  const lastCreatedResult = useGestoresStore((state) => state.lastCreatedResult);
  const setLastCreatedResult = useGestoresStore((state) => state.setLastCreatedResult);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: GestorFormValues) {
    setIsSubmitting(true);
    setError(null);
    setLastCreatedResult(null);

    try {
      const serviceInput = gestoresAdapter.toServiceInput(values);
      const raw = await gestoresService.create(serviceInput);
      const result = gestoresAdapter.toCreatedResult(raw);
      addGestor(result.gestor);
      // Nível não existe no backend (ver gestor-nivel.types.ts) — grava só
      // no override local, associado ao id que acabou de ser gerado.
      if (values.nivel) {
        useGestorNiveisStore.getState().definirNivel(result.gestor.id, values.nivel);
      }
      setLastCreatedResult(result);
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    error,
    submit,
    lastCreatedResult,
    dismissSuccess: () => setLastCreatedResult(null),
  };
}

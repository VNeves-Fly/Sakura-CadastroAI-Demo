"use client";

import { useCallback, useEffect, useState } from "react";
import { useBasesStore } from "@/modules/bases/stores/bases.store";
import { basesAdapter } from "@/modules/bases/adapters/bases.adapter";
import { basesService } from "@/modules/bases/services/bases.service";
import type { BaseFormValues, BaseView } from "@/modules/bases/types/base.types";

export function useUpdateBaseViewModel(id: string) {
  const updateBaseNaStore = useBasesStore((state) => state.updateBase);
  const [base, setBase] = useState<BaseView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const raw = await basesService.getById(id);
      setBase(basesAdapter.toView(raw));
    } catch (caughtError) {
      setLoadError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(values: BaseFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const raw = await basesService.update(id, basesAdapter.toServiceInput(values));
      const atualizado = basesAdapter.toView(raw);
      setBase(atualizado);
      updateBaseNaStore(atualizado);
      return true;
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { base, isLoading, loadError, isSubmitting, submitError, submit };
}

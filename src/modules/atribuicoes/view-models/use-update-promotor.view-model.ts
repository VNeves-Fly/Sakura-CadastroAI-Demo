"use client";

import { useCallback, useEffect, useState } from "react";
import { usePromotoresCrudStore } from "@/modules/atribuicoes/stores/promotores-crud.store";
import { promotoresCrudAdapter } from "@/modules/atribuicoes/adapters/promotores-crud.adapter";
import { promotoresCrudService } from "@/modules/atribuicoes/services/promotores-crud.service";
import type {
  CreatedPromotorResult,
  PromotorCrudView,
  PromotorFormValues,
} from "@/modules/atribuicoes/types/promotor-crud.types";

export function useUpdatePromotorViewModel(id: string) {
  const updatePromotorNaStore = usePromotoresCrudStore((state) => state.updatePromotor);
  const [promotor, setPromotor] = useState<PromotorCrudView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedPromotorResult | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const raw = await promotoresCrudService.getById(id);
      setPromotor(promotoresCrudAdapter.toView(raw));
    } catch (caughtError) {
      setLoadError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(values: PromotorFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const serviceInput = promotoresCrudAdapter.toServiceInput(values);
      const raw = await promotoresCrudService.update(id, serviceInput);
      const updated = promotoresCrudAdapter.toCreatedResult(raw);
      setPromotor(updated.promotor);
      updatePromotorNaStore(updated.promotor);
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
    promotor,
    isLoading,
    loadError,
    isSubmitting,
    submitError,
    submit,
    result,
    dismissResult: () => setResult(null),
  };
}

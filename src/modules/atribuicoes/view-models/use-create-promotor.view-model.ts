"use client";

import { useState } from "react";
import { usePromotoresCrudStore } from "@/modules/atribuicoes/stores/promotores-crud.store";
import { promotoresCrudAdapter } from "@/modules/atribuicoes/adapters/promotores-crud.adapter";
import { promotoresCrudService } from "@/modules/atribuicoes/services/promotores-crud.service";
import type { PromotorFormValues } from "@/modules/atribuicoes/types/promotor-crud.types";

export function useCreatePromotorViewModel() {
  const addPromotor = usePromotoresCrudStore((state) => state.addPromotor);
  const lastCreatedResult = usePromotoresCrudStore((state) => state.lastCreatedResult);
  const setLastCreatedResult = usePromotoresCrudStore((state) => state.setLastCreatedResult);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: PromotorFormValues) {
    setIsSubmitting(true);
    setError(null);
    setLastCreatedResult(null);

    try {
      const serviceInput = promotoresCrudAdapter.toServiceInput(values);
      const raw = await promotoresCrudService.create(serviceInput);
      const result = promotoresCrudAdapter.toCreatedResult(raw);
      addPromotor(result.promotor);
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

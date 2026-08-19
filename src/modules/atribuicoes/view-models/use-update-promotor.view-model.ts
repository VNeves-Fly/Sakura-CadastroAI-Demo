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

// id nullable pra dar pra usar num modal aberto por linha da lista (id só
// existe depois que o usuário clica em "Editar") — mesmo padrão de
// use-update-gestor.view-model.ts. Página de edição full (promotor-edit-view)
// sempre passa um id real, comportamento dela não muda.
export function useUpdatePromotorViewModel(id: string | null) {
  const updatePromotorNaStore = usePromotoresCrudStore((state) => state.updatePromotor);
  const [promotor, setPromotor] = useState<PromotorCrudView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedPromotorResult | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setPromotor(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

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
    if (!id) return false;

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

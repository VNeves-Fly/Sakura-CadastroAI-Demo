"use client";

import { useCallback, useEffect, useState } from "react";
import { useAssociacoesStore } from "@/modules/associacoes/stores/associacoes.store";
import { associacoesAdapter } from "@/modules/associacoes/adapters/associacoes.adapter";
import { associacoesService } from "@/modules/associacoes/services/associacoes.service";
import type {
  AssociacaoFormValues,
  AssociacaoView,
} from "@/modules/associacoes/types/associacao.types";

export function useUpdateAssociacaoViewModel(id: string) {
  const updateAssociacaoNaStore = useAssociacoesStore((state) => state.updateAssociacao);
  const [associacao, setAssociacao] = useState<AssociacaoView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const raw = await associacoesService.getById(id);
      setAssociacao(associacoesAdapter.toView(raw));
    } catch (caughtError) {
      setLoadError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(values: AssociacaoFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const raw = await associacoesService.update(id, associacoesAdapter.toServiceInput(values));
      const atualizado = associacoesAdapter.toView(raw);
      setAssociacao(atualizado);
      updateAssociacaoNaStore(atualizado);
      return true;
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { associacao, isLoading, loadError, isSubmitting, submitError, submit };
}

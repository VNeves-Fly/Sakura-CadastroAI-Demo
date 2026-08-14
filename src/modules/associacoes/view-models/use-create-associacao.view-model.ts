"use client";

import { useState } from "react";
import { useAssociacoesStore } from "@/modules/associacoes/stores/associacoes.store";
import { associacoesAdapter } from "@/modules/associacoes/adapters/associacoes.adapter";
import { associacoesService } from "@/modules/associacoes/services/associacoes.service";
import type { AssociacaoFormValues } from "@/modules/associacoes/types/associacao.types";

export function useCreateAssociacaoViewModel() {
  const addAssociacao = useAssociacoesStore((state) => state.addAssociacao);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: AssociacaoFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const raw = await associacoesService.create(associacoesAdapter.toServiceInput(values));
      addAssociacao(associacoesAdapter.toView(raw));
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, submit };
}

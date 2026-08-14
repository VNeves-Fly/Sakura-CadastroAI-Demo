"use client";

import { useState } from "react";
import { useBasesStore } from "@/modules/bases/stores/bases.store";
import { basesAdapter } from "@/modules/bases/adapters/bases.adapter";
import { basesService } from "@/modules/bases/services/bases.service";
import type { BaseFormValues } from "@/modules/bases/types/base.types";

export function useCreateBaseViewModel() {
  const addBase = useBasesStore((state) => state.addBase);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: BaseFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const raw = await basesService.create(basesAdapter.toServiceInput(values));
      addBase(basesAdapter.toView(raw));
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

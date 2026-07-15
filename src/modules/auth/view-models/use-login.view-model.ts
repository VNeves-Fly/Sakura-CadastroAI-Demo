"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/stores/auth.store";
import { loginAdapter } from "@/modules/auth/adapters/login.adapter";
import { authService } from "@/modules/auth/services/auth.service";
import type { LoginFormValues } from "@/modules/auth/types/login.types";

// Contém as regras de apresentação do fluxo de login: orquestra
// Adapter + Service e decide a navegação, sem conhecer detalhes de HTTP.
export function useLoginViewModel() {
  const router = useRouter();
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const setSubmitting = useAuthStore((state) => state.setSubmitting);
  const setError = useAuthStore((state) => state.setError);
  const reset = useAuthStore((state) => state.reset);

  async function submit(values: LoginFormValues) {
    reset();
    setSubmitting(true);

    const serviceInput = loginAdapter.toServiceInput(values);
    const rawResult = await authService.login(serviceInput);
    const result = loginAdapter.fromServiceResult(rawResult);

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Não foi possível autenticar.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return { isSubmitting, error, submit };
}

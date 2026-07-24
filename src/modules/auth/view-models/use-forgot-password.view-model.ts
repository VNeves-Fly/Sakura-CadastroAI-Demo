"use client";

import { useState } from "react";
import { forgotPasswordService } from "@/modules/auth/services/forgot-password.service";

export function useForgotPasswordViewModel() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit(email: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPasswordService.request(email);
      // Sucesso sempre mostra a mesma mensagem genérica, independente do
      // e-mail existir de fato — ver requestPasswordResetRoute.
      setSubmitted(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, submitted, submit };
}

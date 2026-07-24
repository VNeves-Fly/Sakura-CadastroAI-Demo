"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordService } from "@/modules/auth/services/reset-password.service";

export function useResetPasswordViewModel(token: string) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  async function verifyCode(codigo: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      await resetPasswordService.verifyCode(token, codigo);
      setVerified(true);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPassword(newPassword: string, confirmPassword: string) {
    setError(null);

    if (newPassword.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordService.resetPassword(token, newPassword);
      router.push("/login");
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, verified, verifyCode, submitPassword };
}

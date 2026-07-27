"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { changePasswordService } from "@/modules/auth/services/change-password.service";
import type { ChangePasswordFormValues } from "@/modules/auth/types/change-password.types";

export function useChangePasswordViewModel() {
  const router = useRouter();
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: ChangePasswordFormValues) {
    setError(null);

    if (values.newPassword.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return false;
    }

    if (values.newPassword !== values.confirmPassword) {
      setError("As senhas não coincidem.");
      return false;
    }

    setIsSubmitting(true);

    try {
      await changePasswordService.change(values.newPassword);
      // Atualiza o token sem exigir novo login — ver callback jwt em
      // next-auth.options.ts (trigger "update").
      await update({ mustChangePassword: false });
      router.push("/cadastros");
      router.refresh();
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, submit };
}

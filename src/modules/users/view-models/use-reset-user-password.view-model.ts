"use client";

import { useState } from "react";
import { usersService } from "@/modules/users/services/users.service";

export type ResetUserPasswordStatus = "idle" | "loading" | "sent" | "error";

// Estado por usuário (a lista tem uma ação "Redefinir senha" por linha) —
// um Record em vez de um único isSubmitting/error, já que várias linhas
// podem estar em estados diferentes ao mesmo tempo.
export function useResetUserPasswordViewModel() {
  const [statusById, setStatusById] = useState<Record<string, ResetUserPasswordStatus>>({});

  async function triggerReset(userId: string) {
    setStatusById((current) => ({ ...current, [userId]: "loading" }));

    try {
      await usersService.requestPasswordReset(userId);
      setStatusById((current) => ({ ...current, [userId]: "sent" }));
    } catch {
      setStatusById((current) => ({ ...current, [userId]: "error" }));
    }
  }

  return { statusById, triggerReset };
}

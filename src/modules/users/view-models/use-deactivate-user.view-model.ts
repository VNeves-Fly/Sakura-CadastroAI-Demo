"use client";

import { useState } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";

// "Remover usuário" no modal de edição — desativa (ver
// deactivate-user.use-case.ts), não apaga a linha. Confirmação em alert
// dialog fica no componente que chama isto (usuario-remover-alert.tsx).
export function useDeactivateUserViewModel() {
  const updateUserNaStore = useUsersStore((state) => state.updateUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deactivate(id: string) {
    setIsSubmitting(true);
    setError(null);

    try {
      const raw = await usersService.deactivate(id);
      updateUserNaStore(usersAdapter.toView(raw));
      return true;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { isSubmitting, error, deactivate };
}

"use client";

import { useState } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";
import type { CreateUserFormValues } from "@/modules/users/types/user.types";

// Criação sempre gera senha temporária + e-mail de boas-vindas (ver
// usersAdapter.toServiceInput) — o front nunca mostra a senha, quem recebe
// é o próprio usuário criado por e-mail. Por isso não há "resultado de
// sucesso com senha copiável" aqui (SPEC /usuarios, 2026-08-26): sucesso é
// só o toast disparado pelo usuario-form-modal.tsx.
export function useCreateUserViewModel() {
  const addUser = useUsersStore((state) => state.addUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: CreateUserFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const serviceInput = usersAdapter.toServiceInput(values);
      const raw = await usersService.create(serviceInput);
      addUser(usersAdapter.toView(raw));
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

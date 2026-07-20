"use client";

import { useState } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";
import type { CreateUserFormValues } from "@/modules/users/types/user.types";

export function useCreateUserViewModel() {
  const addUser = useUsersStore((state) => state.addUser);
  const lastCreatedResult = useUsersStore((state) => state.lastCreatedResult);
  const setLastCreatedResult = useUsersStore((state) => state.setLastCreatedResult);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: CreateUserFormValues) {
    setIsSubmitting(true);
    setError(null);
    setLastCreatedResult(null);

    try {
      const serviceInput = usersAdapter.toServiceInput(values);
      const raw = await usersService.create(serviceInput);
      const result = usersAdapter.toCreatedResult(raw);
      addUser(result.user);
      setLastCreatedResult(result);
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    error,
    submit,
    lastCreatedResult,
    dismissSuccess: () => setLastCreatedResult(null),
  };
}

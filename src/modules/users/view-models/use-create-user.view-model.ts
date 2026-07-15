"use client";

import { useState } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";
import type { CreateUserFormValues } from "@/modules/users/types/user.types";

export function useCreateUserViewModel() {
  const addUser = useUsersStore((state) => state.addUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: CreateUserFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const raw = await usersService.create(values);
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

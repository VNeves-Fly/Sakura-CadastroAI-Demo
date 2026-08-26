"use client";

import { useCallback, useEffect, useState } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";
import type { UpdateUserFormValues } from "@/modules/users/types/user.types";

// id nullable pra dar pra usar num modal aberto por linha da lista (id só
// existe depois que o usuário clica em "Editar") — mesmo padrão de
// use-update-gestor.view-model.ts.
export function useUpdateUserViewModel(id: string | null) {
  const usersDaStore = useUsersStore((state) => state.users);
  const updateUserNaStore = useUsersStore((state) => state.updateUser);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // A lista completa já foi carregada pela página (useUsersListViewModel) —
  // acha o usuário ali em vez de buscar de novo na API, mesmo dado que a
  // linha clicada já mostrava.
  const user = id ? (usersDaStore.find((item) => item.id === id) ?? null) : null;

  const load = useCallback(() => {
    setIsLoading(false);
    setLoadError(id && !user ? "Usuário não encontrado." : null);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(values: UpdateUserFormValues) {
    if (!id) return false;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const serviceInput = usersAdapter.toUpdateServiceInput(values);
      const raw = await usersService.update(id, serviceInput);
      updateUserNaStore(usersAdapter.toView(raw));
      return true;
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Erro inesperado.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return { user, isLoading, loadError, isSubmitting, submitError, submit };
}

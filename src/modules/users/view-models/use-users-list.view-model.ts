"use client";

import { useCallback, useEffect } from "react";
import { useUsersStore } from "@/modules/users/stores/users.store";
import { usersAdapter } from "@/modules/users/adapters/users.adapter";
import { usersService } from "@/modules/users/services/users.service";

export function useUsersListViewModel() {
  const users = useUsersStore((state) => state.users);
  const isLoading = useUsersStore((state) => state.isLoading);
  const error = useUsersStore((state) => state.error);
  const setUsers = useUsersStore((state) => state.setUsers);
  const setLoading = useUsersStore((state) => state.setLoading);
  const setError = useUsersStore((state) => state.setError);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const raw = await usersService.list();
      setUsers(usersAdapter.toViewList(raw));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Erro inesperado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setUsers]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return { users, isLoading, error, reload: loadUsers };
}

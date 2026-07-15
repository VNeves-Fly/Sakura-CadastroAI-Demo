import { create } from "zustand";
import type { UserView } from "@/modules/users/types/user.types";

interface UsersState {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
  setUsers: (users: UserView[]) => void;
  addUser: (user: UserView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [user, ...state.users] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

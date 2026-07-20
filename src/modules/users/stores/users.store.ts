import { create } from "zustand";
import type { CreatedUserResult, UserView } from "@/modules/users/types/user.types";

interface UsersState {
  users: UserView[];
  isLoading: boolean;
  error: string | null;
  lastCreatedResult: CreatedUserResult | null;
  setUsers: (users: UserView[]) => void;
  addUser: (user: UserView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLastCreatedResult: (result: CreatedUserResult | null) => void;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  error: null,
  lastCreatedResult: null,
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [user, ...state.users] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastCreatedResult: (result) => set({ lastCreatedResult: result }),
}));

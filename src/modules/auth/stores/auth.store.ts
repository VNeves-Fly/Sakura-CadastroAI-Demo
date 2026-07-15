import { create } from "zustand";

interface AuthState {
  isSubmitting: boolean;
  error: string | null;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isSubmitting: false,
  error: null,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  reset: () => set({ isSubmitting: false, error: null }),
}));

import { create } from "zustand";
import type { BaseView } from "@/modules/bases/types/base.types";

interface BasesState {
  bases: BaseView[];
  isLoading: boolean;
  error: string | null;
  setBases: (bases: BaseView[]) => void;
  addBase: (base: BaseView) => void;
  updateBase: (base: BaseView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBasesStore = create<BasesState>((set) => ({
  bases: [],
  isLoading: false,
  error: null,
  setBases: (bases) => set({ bases }),
  addBase: (base) => set((state) => ({ bases: [base, ...state.bases] })),
  updateBase: (base) =>
    set((state) => ({ bases: state.bases.map((item) => (item.id === base.id ? base : item)) })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

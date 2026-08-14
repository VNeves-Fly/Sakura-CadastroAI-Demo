import { create } from "zustand";
import type { CreatedGestorResult, GestorView } from "@/modules/gestores/types/gestor.types";

interface GestoresState {
  gestores: GestorView[];
  isLoading: boolean;
  error: string | null;
  lastCreatedResult: CreatedGestorResult | null;
  setGestores: (gestores: GestorView[]) => void;
  addGestor: (gestor: GestorView) => void;
  updateGestor: (gestor: GestorView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLastCreatedResult: (result: CreatedGestorResult | null) => void;
}

export const useGestoresStore = create<GestoresState>((set) => ({
  gestores: [],
  isLoading: false,
  error: null,
  lastCreatedResult: null,
  setGestores: (gestores) => set({ gestores }),
  addGestor: (gestor) => set((state) => ({ gestores: [gestor, ...state.gestores] })),
  updateGestor: (gestor) =>
    set((state) => ({
      gestores: state.gestores.map((item) => (item.id === gestor.id ? gestor : item)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastCreatedResult: (result) => set({ lastCreatedResult: result }),
}));

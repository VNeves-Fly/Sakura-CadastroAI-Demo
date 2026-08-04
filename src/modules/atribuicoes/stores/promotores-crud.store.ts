import { create } from "zustand";
import type {
  CreatedPromotorResult,
  PromotorCrudView,
} from "@/modules/atribuicoes/types/promotor-crud.types";

interface PromotoresCrudState {
  promotores: PromotorCrudView[];
  isLoading: boolean;
  error: string | null;
  lastCreatedResult: CreatedPromotorResult | null;
  setPromotores: (promotores: PromotorCrudView[]) => void;
  addPromotor: (promotor: PromotorCrudView) => void;
  updatePromotor: (promotor: PromotorCrudView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLastCreatedResult: (result: CreatedPromotorResult | null) => void;
}

export const usePromotoresCrudStore = create<PromotoresCrudState>((set) => ({
  promotores: [],
  isLoading: false,
  error: null,
  lastCreatedResult: null,
  setPromotores: (promotores) => set({ promotores }),
  addPromotor: (promotor) => set((state) => ({ promotores: [promotor, ...state.promotores] })),
  updatePromotor: (promotor) =>
    set((state) => ({
      promotores: state.promotores.map((item) => (item.id === promotor.id ? promotor : item)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastCreatedResult: (result) => set({ lastCreatedResult: result }),
}));

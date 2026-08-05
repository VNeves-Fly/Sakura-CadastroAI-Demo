import { create } from "zustand";
import type { AssociacaoView } from "@/modules/associacoes/types/associacao.types";

interface AssociacoesState {
  associacoes: AssociacaoView[];
  isLoading: boolean;
  error: string | null;
  setAssociacoes: (associacoes: AssociacaoView[]) => void;
  addAssociacao: (associacao: AssociacaoView) => void;
  updateAssociacao: (associacao: AssociacaoView) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAssociacoesStore = create<AssociacoesState>((set) => ({
  associacoes: [],
  isLoading: false,
  error: null,
  setAssociacoes: (associacoes) => set({ associacoes }),
  addAssociacao: (associacao) =>
    set((state) => ({ associacoes: [associacao, ...state.associacoes] })),
  updateAssociacao: (associacao) =>
    set((state) => ({
      associacoes: state.associacoes.map((item) => (item.id === associacao.id ? associacao : item)),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

import { create } from "zustand";

interface CadastroAgenciaState {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  duplicado: boolean;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setDuplicado: (duplicado: boolean) => void;
  reset: () => void;
}

export const useCadastroAgenciaStore = create<CadastroAgenciaState>((set) => ({
  isSubmitting: false,
  error: null,
  success: false,
  duplicado: false,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setDuplicado: (duplicado) => set({ duplicado }),
  reset: () => set({ isSubmitting: false, error: null, success: false, duplicado: false }),
}));

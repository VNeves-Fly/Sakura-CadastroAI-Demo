import { create } from "zustand";
import type { QsaResultView } from "@/modules/cadastro/types/agencia.types";

export const TOTAL_ETAPAS = 7;

interface CnpjStatus {
  valido: boolean;
  mensagem: string | null;
}

interface CadastroWizardState {
  etapaAtual: number;
  maiorEtapaAlcancada: number;
  origem: string | null;

  // Passo 1 — Documentos
  cnpj: string;
  cnpjStatus: CnpjStatus;
  qsaChecking: boolean;
  qsaResult: QsaResultView | null;
  avisoAlfanumerico: boolean;
  contratoSocial: File | null;
  cadastur: File | null;

  // Submissão (passo 7)
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  duplicado: boolean;

  setOrigem: (origem: string | null) => void;
  irParaEtapa: (etapa: number) => void;
  proximaEtapa: () => void;
  etapaAnterior: () => void;
  setCnpj: (cnpj: string) => void;
  setCnpjStatus: (status: CnpjStatus) => void;
  setQsaChecking: (checking: boolean) => void;
  setQsaResult: (result: QsaResultView | null) => void;
  setAvisoAlfanumerico: (aviso: boolean) => void;
  setContratoSocial: (file: File | null) => void;
  setCadastur: (file: File | null) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setDuplicado: (duplicado: boolean) => void;
  reset: () => void;
}

export const useCadastroWizardStore = create<CadastroWizardState>((set) => ({
  etapaAtual: 1,
  maiorEtapaAlcancada: 1,
  origem: null,

  cnpj: "",
  cnpjStatus: { valido: false, mensagem: null },
  qsaChecking: false,
  qsaResult: null,
  avisoAlfanumerico: false,
  contratoSocial: null,
  cadastur: null,

  isSubmitting: false,
  error: null,
  success: false,
  duplicado: false,

  setOrigem: (origem) => set({ origem }),

  irParaEtapa: (etapa) =>
    set((state) => ({
      etapaAtual: etapa,
      maiorEtapaAlcancada: Math.max(state.maiorEtapaAlcancada, etapa),
    })),

  proximaEtapa: () =>
    set((state) => {
      const etapa = Math.min(state.etapaAtual + 1, TOTAL_ETAPAS);
      return { etapaAtual: etapa, maiorEtapaAlcancada: Math.max(state.maiorEtapaAlcancada, etapa) };
    }),

  etapaAnterior: () => set((state) => ({ etapaAtual: Math.max(state.etapaAtual - 1, 1) })),

  setCnpj: (cnpj) => set({ cnpj }),
  setCnpjStatus: (cnpjStatus) => set({ cnpjStatus }),
  setQsaChecking: (qsaChecking) => set({ qsaChecking }),
  setQsaResult: (qsaResult) => set({ qsaResult }),
  setAvisoAlfanumerico: (avisoAlfanumerico) => set({ avisoAlfanumerico }),
  setContratoSocial: (contratoSocial) => set({ contratoSocial }),
  setCadastur: (cadastur) => set({ cadastur }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setDuplicado: (duplicado) => set({ duplicado }),

  reset: () =>
    set({
      etapaAtual: 1,
      maiorEtapaAlcancada: 1,
      cnpj: "",
      cnpjStatus: { valido: false, mensagem: null },
      qsaChecking: false,
      qsaResult: null,
      avisoAlfanumerico: false,
      contratoSocial: null,
      cadastur: null,
      isSubmitting: false,
      error: null,
      success: false,
      duplicado: false,
    }),
}));

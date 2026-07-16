import { create } from "zustand";
import type { QsaResultView } from "@/modules/cadastro/types/agencia.types";
import {
  criarSocioWizardVazio,
  type SocioWizardFormValues,
} from "@/modules/cadastro/types/socio-wizard.types";
import {
  criarEnderecoBancoVazio,
  type EnderecoBancoFormValues,
} from "@/modules/cadastro/types/endereco-banco.types";

export const TOTAL_ETAPAS = 4;

interface CnpjStatus {
  valido: boolean;
  mensagem: string | null;
}

interface CadastroWizardState {
  // Página única com seções empilhadas, reveladas progressivamente —
  // secoesReveladas é quantas seções (a partir da 1) já estão visíveis.
  secoesReveladas: number;
  origem: string | null;

  // Seção 1 — Empresa (documentos + dados da empresa)
  cnpj: string;
  cnpjStatus: CnpjStatus;
  qsaChecking: boolean;
  qsaResult: QsaResultView | null;
  avisoAlfanumerico: boolean;
  contratoSocial: File | null;

  telefoneComercial: string;
  telefoneComercialPais: string;
  semTelefoneComercial: boolean;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;

  // Seção 2 — Sócios (representante é um sócio com flag isRepresentante)
  socios: SocioWizardFormValues[];
  socioCepBuscando: number | null;

  // Seção 3 — Endereço & Banco
  enderecoBanco: EnderecoBancoFormValues;
  enderecoBancoCepBuscando: boolean;

  // Submissão (última seção)
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  duplicado: boolean;

  setOrigem: (origem: string | null) => void;
  avancarSecao: () => void;
  setCnpj: (cnpj: string) => void;
  setCnpjStatus: (status: CnpjStatus) => void;
  setQsaChecking: (checking: boolean) => void;
  setQsaResult: (result: QsaResultView | null) => void;
  setAvisoAlfanumerico: (aviso: boolean) => void;
  setContratoSocial: (file: File | null) => void;

  setTelefoneComercial: (telefone: string) => void;
  setTelefoneComercialPais: (pais: string) => void;
  setSemTelefoneComercial: (semTelefone: boolean) => void;
  setEmailOperacional: (email: string) => void;
  setEmailComercial: (email: string) => void;
  setEmailFinanceiro: (email: string) => void;

  setSocios: (socios: SocioWizardFormValues[]) => void;
  setSocioCepBuscando: (indice: number | null) => void;

  setEnderecoBanco: (dados: EnderecoBancoFormValues) => void;
  setEnderecoBancoCepBuscando: (buscando: boolean) => void;

  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: boolean) => void;
  setDuplicado: (duplicado: boolean) => void;
  reset: () => void;
}

export const useCadastroWizardStore = create<CadastroWizardState>((set) => ({
  secoesReveladas: 1,
  origem: null,

  cnpj: "",
  cnpjStatus: { valido: false, mensagem: null },
  qsaChecking: false,
  qsaResult: null,
  avisoAlfanumerico: false,
  contratoSocial: null,

  telefoneComercial: "",
  telefoneComercialPais: "BR",
  semTelefoneComercial: false,
  emailOperacional: "",
  emailComercial: "",
  emailFinanceiro: "",

  socios: [criarSocioWizardVazio()],
  socioCepBuscando: null,

  enderecoBanco: criarEnderecoBancoVazio(),
  enderecoBancoCepBuscando: false,

  isSubmitting: false,
  error: null,
  success: false,
  duplicado: false,

  setOrigem: (origem) => set({ origem }),

  avancarSecao: () =>
    set((state) => ({ secoesReveladas: Math.min(state.secoesReveladas + 1, TOTAL_ETAPAS) })),

  setCnpj: (cnpj) => set({ cnpj }),
  setCnpjStatus: (cnpjStatus) => set({ cnpjStatus }),
  setQsaChecking: (qsaChecking) => set({ qsaChecking }),
  setQsaResult: (qsaResult) => set({ qsaResult }),
  setAvisoAlfanumerico: (avisoAlfanumerico) => set({ avisoAlfanumerico }),
  setContratoSocial: (contratoSocial) => set({ contratoSocial }),

  setTelefoneComercial: (telefoneComercial) => set({ telefoneComercial }),
  setTelefoneComercialPais: (telefoneComercialPais) => set({ telefoneComercialPais }),
  setSemTelefoneComercial: (semTelefoneComercial) => set({ semTelefoneComercial }),
  setEmailOperacional: (emailOperacional) => set({ emailOperacional }),
  setEmailComercial: (emailComercial) => set({ emailComercial }),
  setEmailFinanceiro: (emailFinanceiro) => set({ emailFinanceiro }),

  setSocios: (socios) => set({ socios }),
  setSocioCepBuscando: (socioCepBuscando) => set({ socioCepBuscando }),

  setEnderecoBanco: (enderecoBanco) => set({ enderecoBanco }),
  setEnderecoBancoCepBuscando: (enderecoBancoCepBuscando) => set({ enderecoBancoCepBuscando }),

  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setError: (error) => set({ error }),
  setSuccess: (success) => set({ success }),
  setDuplicado: (duplicado) => set({ duplicado }),

  reset: () =>
    set({
      secoesReveladas: 1,
      cnpj: "",
      cnpjStatus: { valido: false, mensagem: null },
      qsaChecking: false,
      qsaResult: null,
      avisoAlfanumerico: false,
      contratoSocial: null,
      telefoneComercial: "",
      telefoneComercialPais: "BR",
      semTelefoneComercial: false,
      emailOperacional: "",
      emailComercial: "",
      emailFinanceiro: "",
      socios: [criarSocioWizardVazio()],
      socioCepBuscando: null,
      enderecoBanco: criarEnderecoBancoVazio(),
      enderecoBancoCepBuscando: false,
      isSubmitting: false,
      error: null,
      success: false,
      duplicado: false,
    }),
}));

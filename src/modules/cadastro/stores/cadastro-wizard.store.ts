import { create } from "zustand";
import type { QsaResultView } from "@/modules/cadastro/types/agencia.types";
import type { SocioWizardFormValues } from "@/modules/cadastro/types/socio-wizard.types";

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

  siteEmpresa: string;
  semSite: boolean;
  telefoneComercial: string;
  telefoneComercialPais: string;
  semTelefoneComercial: boolean;
  emailOperacional: string;
  emailComercial: string;
  emailFinanceiro: string;

  // Seção 2 — Sócios (representante é um sócio com flag isRepresentante)
  socios: SocioWizardFormValues[];
  socioCepBuscando: number | null;

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

  setSiteEmpresa: (site: string) => void;
  setSemSite: (semSite: boolean) => void;
  setTelefoneComercial: (telefone: string) => void;
  setTelefoneComercialPais: (pais: string) => void;
  setSemTelefoneComercial: (semTelefone: boolean) => void;
  setEmailOperacional: (email: string) => void;
  setEmailComercial: (email: string) => void;
  setEmailFinanceiro: (email: string) => void;

  setSocios: (socios: SocioWizardFormValues[]) => void;
  setSocioCepBuscando: (indice: number | null) => void;

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

  siteEmpresa: "",
  semSite: false,
  telefoneComercial: "",
  telefoneComercialPais: "BR",
  semTelefoneComercial: false,
  emailOperacional: "",
  emailComercial: "",
  emailFinanceiro: "",

  socios: [],
  socioCepBuscando: null,

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

  setSiteEmpresa: (siteEmpresa) => set({ siteEmpresa }),
  setSemSite: (semSite) => set({ semSite }),
  setTelefoneComercial: (telefoneComercial) => set({ telefoneComercial }),
  setTelefoneComercialPais: (telefoneComercialPais) => set({ telefoneComercialPais }),
  setSemTelefoneComercial: (semTelefoneComercial) => set({ semTelefoneComercial }),
  setEmailOperacional: (emailOperacional) => set({ emailOperacional }),
  setEmailComercial: (emailComercial) => set({ emailComercial }),
  setEmailFinanceiro: (emailFinanceiro) => set({ emailFinanceiro }),

  setSocios: (socios) => set({ socios }),
  setSocioCepBuscando: (socioCepBuscando) => set({ socioCepBuscando }),

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
      siteEmpresa: "",
      semSite: false,
      telefoneComercial: "",
      telefoneComercialPais: "BR",
      semTelefoneComercial: false,
      emailOperacional: "",
      emailComercial: "",
      emailFinanceiro: "",
      socios: [],
      socioCepBuscando: null,
      isSubmitting: false,
      error: null,
      success: false,
      duplicado: false,
    }),
}));

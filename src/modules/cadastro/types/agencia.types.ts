export type QsaStatus = "idle" | "confirmado" | "divergente";

export interface SocioFormValues {
  nome: string;
  email: string;
  telefone: string;
  rg: File | null;
  qsaStatus: QsaStatus;
  modoManual: boolean;
}

export function criarSocioVazio(): SocioFormValues {
  return {
    nome: "",
    email: "",
    telefone: "",
    rg: null,
    qsaStatus: "idle",
    modoManual: false,
  };
}

export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
}

export interface SubmitResultView {
  success: boolean;
  duplicado?: boolean;
  agenciaId?: string;
  error?: string;
}

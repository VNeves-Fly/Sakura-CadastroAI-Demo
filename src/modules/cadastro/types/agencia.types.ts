export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export interface SubmitResultView {
  success: boolean;
  duplicado?: boolean;
  agenciaId?: string;
  error?: string;
}

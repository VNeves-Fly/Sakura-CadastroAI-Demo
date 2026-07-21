export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export interface ContratoSocialAnaliseView {
  cnpjConfere: boolean | null;
  nomesSocios: string[];
  alertas: string[];
  confianca: number;
}

export interface DocumentoIdentificacaoAnaliseView {
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  alertas: string[];
  confianca: number;
}

export interface SubmitResultView {
  success: boolean;
  precisaRevisaoManual?: boolean;
  duplicado?: boolean;
  agenciaId?: string;
  error?: string;
}

export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export interface EnderecoSocioContratoSocialView {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface SocioContratoSocialView {
  nome: string;
  endereco: EnderecoSocioContratoSocialView | null;
}

export interface ContratoSocialAnaliseView {
  cnpjConfere: boolean | null;
  socios: SocioContratoSocialView[];
  alertas: string[];
  confianca: number;
}

export interface DocumentoIdentificacaoAnaliseView {
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
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

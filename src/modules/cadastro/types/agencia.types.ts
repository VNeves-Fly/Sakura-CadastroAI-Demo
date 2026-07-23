export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export interface SocioContratoSocialView {
  nome: string;
}

export interface EnderecoEmpresaContratoSocialView {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface ContratoSocialAnaliseView {
  cnpjConfere: boolean | null;
  socios: SocioContratoSocialView[];
  alertas: string[];
  confianca: number;
  razaoSocial: string | null;
  capitalSocial: number | null;
  endereco: EnderecoEmpresaContratoSocialView | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
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

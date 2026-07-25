export interface QsaResultView {
  razaoSocial: string;
  cnaeCompativel: boolean;
  nomesSocios: string[];
  dataAbertura: string;
  telefoneReceita: string;
  emailReceita: string;
}

export interface EnderecoContratoSocialView {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

// Um sócio extraído do `qsa` do contrato social — administrativo/ativo são
// derivados pela IA (inferidos do contexto do documento, não impressos).
export interface SocioContratoSocialView {
  nome: string;
  cpf: string | null;
  dataNascimento: string | null;
  estadoCivil: string | null;
  nacionalidade: string | null;
  regimeBens: string | null;
  participacao: number | null;
  rg: string | null;
  rgExpedidor: string | null;
  rgExpedidoUf: string | null;
  endereco: EnderecoContratoSocialView | null;
  administrativo: boolean | null;
  ativo: boolean | null;
}

export interface ContratoSocialAnaliseView {
  cnpjConfere: boolean | null;
  socios: SocioContratoSocialView[];
  alertas: string[];
  confianca: number;
  razaoSocial: string | null;
  capitalSocial: number | null;
  endereco: EnderecoContratoSocialView | null;
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
  duplicado?: boolean;
  agenciaId?: string;
  error?: string;
}

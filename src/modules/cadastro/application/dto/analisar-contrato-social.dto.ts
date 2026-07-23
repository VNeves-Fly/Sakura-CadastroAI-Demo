export interface AnalisarContratoSocialInput {
  cnpj: string;
  contratoSocial: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

// Shape confirmado do agente (document_type.py, AgentsService) — usado
// tanto pro endereço da empresa quanto pro endereço de cada sócio dentro
// de `qsa` (mesma forma nos dois: cep/logradouro/numero/complemento/
// bairro/municipio/uf, não texto corrido).
export interface EnderecoContratoSocial {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
}

// Um item de `qsa` (lista de objetos — substituiu o antigo
// `socios_nomes_completos`, que só tinha nomes soltos). `administrativo` e
// `ativo` são campos derivados pela IA (inferidos do contexto, não
// impressos no documento) — ver document_type.py no AgentsService.
export interface SocioContratoSocialExtraido {
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
  endereco: EnderecoContratoSocial | null;
  administrativo: boolean | null;
  ativo: boolean | null;
}

export interface AnalisarContratoSocialOutput {
  cnpjConfere: boolean | null;
  socios: SocioContratoSocialExtraido[];
  alertas: string[];
  confianca: number;
  resumoAnalise: string | null;
  camposObrigatoriosPresentes: boolean | null;
  camposExtras: Record<string, unknown>;
  // Campos principais que a IA já extrai do contrato social mas que antes
  // eram descartados (só o cnpj e qsa viravam saída) — nunca lançam erro
  // quando a IA não encontra o campo ou devolve algo no formato errado.
  razaoSocialExtraida: string | null;
  capitalSocial: number | null;
  enderecoEmpresa: EnderecoContratoSocial | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
}

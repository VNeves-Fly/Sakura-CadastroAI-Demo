export interface AnalisarContratoSocialInput {
  cnpj: string;
  contratoSocial: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

export interface SocioContratoSocialExtraido {
  nome: string;
}

// Shape confirmado do agente (document_type.py, AgentsService): `endereco`
// é um objeto — cep/logradouro/numero/complemento/bairro/municipio/uf —
// não texto corrido.
export interface EnderecoEmpresaContratoSocial {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
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
  // eram descartados (só o cnpj e socios_nomes_completos viravam saída) —
  // nunca lançam erro quando a IA não encontra o campo ou devolve algo no
  // formato errado.
  razaoSocialExtraida: string | null;
  capitalSocial: number | null;
  enderecoEmpresa: EnderecoEmpresaContratoSocial | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
}

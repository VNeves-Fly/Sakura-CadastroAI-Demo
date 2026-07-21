export interface AnalisarContratoSocialInput {
  cnpj: string;
  contratoSocial: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

export interface AnalisarContratoSocialOutput {
  cnpjConfere: boolean | null;
  nomesSocios: string[];
  alertas: string[];
  confianca: number;
  resumoAnalise: string | null;
  camposObrigatoriosPresentes: boolean | null;
  camposExtras: Record<string, unknown>;
  // Campos principais que a IA já extrai do contrato social mas que antes
  // eram descartados (só o cnpj e socios_nomes_completos viravam saída) —
  // string ou null, nunca lançam erro quando a IA não encontra o campo ou
  // devolve algo no formato errado.
  razaoSocialExtraida: string | null;
  capitalSocial: string | null;
  enderecoEmpresa: string | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
}

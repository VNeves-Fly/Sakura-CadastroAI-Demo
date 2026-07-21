export interface AnalisarContratoSocialInput {
  cnpj: string;
  contratoSocial: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

export interface EnderecoSocioContratoSocial {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface SocioContratoSocialExtraido {
  nome: string;
  // Especulativo — MEI às vezes não traz endereço dos sócios no contrato
  // social, e não há confirmação de que o agente devolva esse shape rico
  // (`socios: [{nome, endereco}]`); quando ausente, fica null sem travar
  // nada (ver extrairSocios() no use-case, que degrada pro shape hoje
  // confirmado, só nomes).
  endereco: EnderecoSocioContratoSocial | null;
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
  // string ou null, nunca lançam erro quando a IA não encontra o campo ou
  // devolve algo no formato errado.
  razaoSocialExtraida: string | null;
  capitalSocial: string | null;
  enderecoEmpresa: string | null;
  objetoSocial: string | null;
  dataConstituicao: string | null;
}

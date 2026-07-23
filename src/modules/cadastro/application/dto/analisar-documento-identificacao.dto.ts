export interface AnalisarDocumentoIdentificacaoInput {
  cnpj: string;
  indice: number;
  documento: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  };
}

export interface AnalisarDocumentoIdentificacaoOutput {
  nome: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  // Extraídos de `camposExtraidos.rg` (objeto {value, expedidor,
  // expedidor_uf} quando o doc é CNH referenciando um RG) ou, quando o
  // próprio documento classifica como RG, de numero_documento/orgao_emissor
  // (ver extrairDadosRg no use-case).
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  alertas: string[];
  confianca: number;
}

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
  alertas: string[];
  confianca: number;
}

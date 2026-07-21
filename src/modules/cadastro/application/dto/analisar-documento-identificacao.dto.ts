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
  // Especulativos: não há confirmação de que o agente de IA devolva essas
  // chaves pro RG/CNH (sem documentação, teste ou dado real de produção
  // até o momento) — ficam null enquanto isso não for confirmado, sem
  // travar nada.
  rg: string | null;
  rgOrgaoEmissor: string | null;
  rgUf: string | null;
  alertas: string[];
  confianca: number;
}

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
}

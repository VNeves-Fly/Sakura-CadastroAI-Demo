export interface UploadedFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface SocioInput {
  nome: string;
  email: string;
  telefone: string;
  rg: UploadedFileInput;
}

export interface PreCadastrarAgenciaInput {
  cnpj: string;
  contratoSocial: UploadedFileInput;
  socios: SocioInput[];
  origem: string | null;
}

export interface PreCadastrarAgenciaOutput {
  id: string;
  cnpj: string;
  razaoSocial: string;
  status: string;
}

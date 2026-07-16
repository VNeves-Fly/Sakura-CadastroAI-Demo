import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";

export interface UploadedDocumentData {
  fileName: string;
  mimeType: string;
  path: string;
  size: number;
}

export interface CreateAgenciaSocioData {
  nome: string;
  email: string;
  telefone: string;
  origem: string;
  rgDocumento: UploadedDocumentData;
}

export interface CreateAgenciaData {
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  origem: string | null;
  contratoSocialDocumento: UploadedDocumentData;
  socios: CreateAgenciaSocioData[];
}

export interface AgenciaRepository {
  findByCnpj(cnpj: string): Promise<Agencia | null>;
  create(data: CreateAgenciaData): Promise<Agencia>;
}

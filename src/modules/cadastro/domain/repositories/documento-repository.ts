import type { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type { StatusDocumento, TipoDocumento } from "@/modules/cadastro/domain/enums";

export interface CreateDocumentoData {
  agenciaId: string;
  representanteLegalId?: string | null;
  tipo: TipoDocumento;
  fileName?: string | null;
  mimeType?: string | null;
  gcsPath: string;
  gcsBucket?: string | null;
  gcsSize?: number | null;
  gcsMd5?: string | null;
}

export interface AtualizarStatusDocumentoData {
  status: StatusDocumento;
  verificado?: boolean;
  reprovadoPor?: string | null;
  motivoReprovacao?: string | null;
  reprovadoEm?: Date | null;
}

export interface DocumentoRepository {
  findById(id: string): Promise<Documento | null>;
  findByAgenciaId(agenciaId: string): Promise<Documento[]>;
  findByRepresentanteLegalId(representanteLegalId: string): Promise<Documento[]>;
  create(data: CreateDocumentoData): Promise<Documento>;
  atualizarStatus(id: string, data: AtualizarStatusDocumentoData): Promise<Documento>;
}

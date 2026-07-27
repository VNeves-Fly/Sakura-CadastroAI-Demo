import type { PrismaClient, Documento as DocumentoRecord } from "@prisma/client";
import { Documento } from "@/modules/cadastro/domain/entities/documento.entity";
import type {
  AtualizarStatusDocumentoData,
  CreateDocumentoData,
  DocumentoRepository,
} from "@/modules/cadastro/domain/repositories/documento-repository";

// Exportado (não só método privado da classe) porque
// PrismaAgenciaRepository também precisa mapear Documento — o dossiê da
// agência inclui os documentos junto no mesmo findUnique, sem repetir a
// query aqui.
export function documentoRecordToDomain(record: DocumentoRecord): Documento {
  return Documento.create({
    id: record.id,
    agenciaId: record.agenciaId,
    representanteLegalId: record.representanteLegalId,
    tipo: record.tipo,
    fileName: record.fileName,
    mimeType: record.mimeType,
    gcsPath: record.gcsPath,
    gcsBucket: record.gcsBucket,
    gcsSize: record.gcsSize,
    gcsMd5: record.gcsMd5,
    status: record.status,
    verificado: record.verificado,
    reprovadoPor: record.reprovadoPor,
    motivoReprovacao: record.motivoReprovacao,
    reprovadoEm: record.reprovadoEm,
    aprovadoPor: record.aprovadoPor,
    motivoAprovacao: record.motivoAprovacao,
    aprovadoEm: record.aprovadoEm,
    inseridoManualmentePor: record.inseridoManualmentePor,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class PrismaDocumentoRepository implements DocumentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Documento | null> {
    const record = await this.prisma.documento.findUnique({ where: { id } });
    return record ? documentoRecordToDomain(record) : null;
  }

  async findByAgenciaId(agenciaId: string): Promise<Documento[]> {
    const records = await this.prisma.documento.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "asc" },
    });
    return records.map(documentoRecordToDomain);
  }

  async findByRepresentanteLegalId(representanteLegalId: string): Promise<Documento[]> {
    const records = await this.prisma.documento.findMany({
      where: { representanteLegalId },
      orderBy: { createdAt: "asc" },
    });
    return records.map(documentoRecordToDomain);
  }

  async create(data: CreateDocumentoData): Promise<Documento> {
    const record = await this.prisma.documento.create({ data });
    return documentoRecordToDomain(record);
  }

  async atualizarStatus(id: string, data: AtualizarStatusDocumentoData): Promise<Documento> {
    const record = await this.prisma.documento.update({
      where: { id },
      data,
    });
    return documentoRecordToDomain(record);
  }
}

import type { PrismaClient, AnaliseIaDocumento as AnaliseIaDocumentoRecord } from "@prisma/client";
import { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type {
  AnaliseIaDocumentoRepository,
  CreateAnaliseIaDocumentoData,
} from "@/modules/cadastro/domain/repositories/analise-ia-documento-repository";

export class PrismaAnaliseIaDocumentoRepository implements AnaliseIaDocumentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDocumentoId(documentoId: string): Promise<AnaliseIaDocumento | null> {
    const record = await this.prisma.analiseIaDocumento.findUnique({
      where: { documentoId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateAnaliseIaDocumentoData): Promise<AnaliseIaDocumento> {
    const record = await this.prisma.analiseIaDocumento.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: AnaliseIaDocumentoRecord): AnaliseIaDocumento {
    return AnaliseIaDocumento.create({
      id: record.id,
      documentoId: record.documentoId,
      numeroCadastur: record.numeroCadastur,
      razaoSocialExtraida: record.razaoSocialExtraida,
      dataCadastroExtraida: record.dataCadastroExtraida,
      dataValidadeExtraida: record.dataValidadeExtraida,
      situacaoExtraida: record.situacaoExtraida,
      cnaeExtraido: record.cnaeExtraido,
      scoreConfianca: record.scoreConfianca?.toNumber() ?? null,
      processadoEm: record.processadoEm,
    });
  }
}

import type {
  Prisma,
  PrismaClient,
  AnaliseIaDocumento as AnaliseIaDocumentoRecord,
} from "@prisma/client";
import { AnaliseIaDocumento } from "@/modules/cadastro/domain/entities/analise-ia-documento.entity";
import type {
  AnaliseIaDocumentoRepository,
  CreateAnaliseIaDocumentoData,
} from "@/modules/cadastro/domain/repositories/analise-ia-documento-repository";
import type { AnaliseIaComparacaoCampo } from "@/modules/cadastro/domain/services/document-analysis-service";

export class PrismaAnaliseIaDocumentoRepository implements AnaliseIaDocumentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDocumentoId(documentoId: string): Promise<AnaliseIaDocumento | null> {
    const record = await this.prisma.analiseIaDocumento.findUnique({
      where: { documentoId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateAnaliseIaDocumentoData): Promise<AnaliseIaDocumento> {
    const record = await this.prisma.analiseIaDocumento.create({
      data: data as Prisma.AnaliseIaDocumentoUncheckedCreateInput,
    });
    return this.toDomain(record);
  }

  private toDomain(record: AnaliseIaDocumentoRecord): AnaliseIaDocumento {
    return AnaliseIaDocumento.create({
      id: record.id,
      documentoId: record.documentoId,
      camposExtraidos: record.camposExtraidos as Record<string, unknown>,
      camposExtras: record.camposExtras as Record<string, unknown>,
      confiancaExtracao: record.confiancaExtracao.toNumber(),
      alertas: record.alertas,
      resumoAnalise: record.resumoAnalise,
      textoBruto: record.textoBruto,
      formatoValido: record.formatoValido,
      camposObrigatoriosPresentes: record.camposObrigatoriosPresentes,
      referenciaCruzadaOk: record.referenciaCruzadaOk,
      detalhesChecagem: record.detalhesChecagem as Record<string, unknown> | null,
      parecer: record.parecer,
      comparacaoOficial: record.comparacaoOficial as AnaliseIaComparacaoCampo[] | null,
      processadoEm: record.processadoEm,
    });
  }
}

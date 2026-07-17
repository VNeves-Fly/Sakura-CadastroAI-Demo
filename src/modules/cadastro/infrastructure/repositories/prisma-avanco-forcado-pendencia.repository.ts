import type {
  PrismaClient,
  AvancoForcadoPendencia as AvancoForcadoPendenciaRecord,
} from "@prisma/client";
import { AvancoForcadoPendencia } from "@/modules/cadastro/domain/entities/avanco-forcado-pendencia.entity";
import type {
  AvancoForcadoPendenciaRepository,
  CreateAvancoForcadoPendenciaData,
} from "@/modules/cadastro/domain/repositories/avanco-forcado-pendencia-repository";

export class PrismaAvancoForcadoPendenciaRepository implements AvancoForcadoPendenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAvancoForcadoId(avancoForcadoId: string): Promise<AvancoForcadoPendencia[]> {
    const records = await this.prisma.avancoForcadoPendencia.findMany({
      where: { avancoForcadoId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateAvancoForcadoPendenciaData): Promise<AvancoForcadoPendencia> {
    const record = await this.prisma.avancoForcadoPendencia.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: AvancoForcadoPendenciaRecord): AvancoForcadoPendencia {
    return AvancoForcadoPendencia.create({
      id: record.id,
      avancoForcadoId: record.avancoForcadoId,
      descricao: record.descricao,
    });
  }
}

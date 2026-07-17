import type { PrismaClient, AvancoForcado as AvancoForcadoRecord } from "@prisma/client";
import { AvancoForcado } from "@/modules/cadastro/domain/entities/avanco-forcado.entity";
import type {
  AvancoForcadoRepository,
  CreateAvancoForcadoData,
} from "@/modules/cadastro/domain/repositories/avanco-forcado-repository";

export class PrismaAvancoForcadoRepository implements AvancoForcadoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<AvancoForcado | null> {
    const record = await this.prisma.avancoForcado.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByAgenciaId(agenciaId: string): Promise<AvancoForcado[]> {
    const records = await this.prisma.avancoForcado.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateAvancoForcadoData): Promise<AvancoForcado> {
    const record = await this.prisma.avancoForcado.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: AvancoForcadoRecord): AvancoForcado {
    return AvancoForcado.create({
      id: record.id,
      agenciaId: record.agenciaId,
      etapaAlvo: record.etapaAlvo,
      motivo: record.motivo,
      gateMotivoBloqueio: record.gateMotivoBloqueio,
      statusReal: record.statusReal,
      solicitadoPor: record.solicitadoPor,
      autorizadoPor: record.autorizadoPor,
      createdAt: record.createdAt,
    });
  }
}

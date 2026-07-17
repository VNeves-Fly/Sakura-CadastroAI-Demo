import type { PrismaClient, DecisaoHumana as DecisaoHumanaRecord } from "@prisma/client";
import { DecisaoHumana } from "@/modules/cadastro/domain/entities/decisao-humana.entity";
import type {
  CreateDecisaoHumanaData,
  DecisaoHumanaRepository,
} from "@/modules/cadastro/domain/repositories/decisao-humana-repository";

export class PrismaDecisaoHumanaRepository implements DecisaoHumanaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<DecisaoHumana[]> {
    const records = await this.prisma.decisaoHumana.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateDecisaoHumanaData): Promise<DecisaoHumana> {
    const record = await this.prisma.decisaoHumana.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: DecisaoHumanaRecord): DecisaoHumana {
    return DecisaoHumana.create({
      id: record.id,
      agenciaId: record.agenciaId,
      etapa: record.etapa,
      decisaoIa: record.decisaoIa,
      decisaoHumana: record.decisaoHumana,
      justificativa: record.justificativa,
      usuarioEmail: record.usuarioEmail,
      modeloIa: record.modeloIa,
      scoreIa: record.scoreIa,
      divergiu: record.divergiu,
      createdAt: record.createdAt,
    });
  }
}

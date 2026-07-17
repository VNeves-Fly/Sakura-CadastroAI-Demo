import type { PrismaClient, Alerta as AlertaRecord } from "@prisma/client";
import { Alerta } from "@/modules/cadastro/domain/entities/alerta.entity";
import type {
  AlertaRepository,
  CreateAlertaData,
} from "@/modules/cadastro/domain/repositories/alerta-repository";

export class PrismaAlertaRepository implements AlertaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<Alerta[]> {
    const records = await this.prisma.alerta.findMany({
      where: { agenciaId },
      orderBy: { criadoEm: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateAlertaData): Promise<Alerta> {
    const record = await this.prisma.alerta.create({ data });
    return this.toDomain(record);
  }

  async resolver(id: string): Promise<Alerta> {
    const record = await this.prisma.alerta.update({
      where: { id },
      data: { resolvidoEm: new Date() },
    });
    return this.toDomain(record);
  }

  private toDomain(record: AlertaRecord): Alerta {
    return Alerta.create({
      id: record.id,
      agenciaId: record.agenciaId,
      tipo: record.tipo,
      mensagem: record.mensagem,
      criadoEm: record.criadoEm,
      resolvidoEm: record.resolvidoEm,
    });
  }
}

import type { PrismaClient, Notificacao as NotificacaoRecord } from "@prisma/client";
import { Notificacao } from "@/modules/cadastro/domain/entities/notificacao.entity";
import type {
  CreateNotificacaoData,
  NotificacaoRepository,
} from "@/modules/cadastro/domain/repositories/notificacao-repository";

export class PrismaNotificacaoRepository implements NotificacaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<Notificacao[]> {
    const records = await this.prisma.notificacao.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateNotificacaoData): Promise<Notificacao> {
    const record = await this.prisma.notificacao.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: NotificacaoRecord): Notificacao {
    return Notificacao.create({
      id: record.id,
      agenciaId: record.agenciaId,
      tipo: record.tipo,
      titulo: record.titulo,
      mensagem: record.mensagem,
      createdAt: record.createdAt,
    });
  }
}

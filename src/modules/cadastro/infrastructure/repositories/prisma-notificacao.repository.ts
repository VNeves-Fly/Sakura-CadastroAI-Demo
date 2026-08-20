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

  // Transação: toda notificação da agência significa "ela respondeu",
  // então desliga o infoPendente (ver comentário no schema.prisma) na
  // mesma operação — nunca existe um estado intermediário onde a
  // notificação já foi gravada mas a tag ainda está ligada.
  async create(data: CreateNotificacaoData): Promise<Notificacao> {
    const [record] = await this.prisma.$transaction([
      this.prisma.notificacao.create({ data }),
      this.prisma.agencia.update({
        where: { id: data.agenciaId },
        data: { infoPendente: false },
      }),
    ]);
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

import type { PrismaClient, EmailLog as EmailLogRecord } from "@prisma/client";
import { EmailLog } from "@/modules/shared/domain/entities/email-log.entity";
import type { DisparoEmail } from "@/modules/shared/domain/enums";
import type {
  CreateEmailLogData,
  EmailLogListItem,
  EmailLogRepository,
  ListarEmailLogsFiltros,
} from "@/modules/shared/domain/repositories/email-log-repository";

export class PrismaEmailLogRepository implements EmailLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateEmailLogData): Promise<EmailLog> {
    const record = await this.prisma.emailLog.create({
      data: {
        destinatario: data.destinatario,
        assunto: data.assunto,
        corpo: data.corpo,
        origem: data.origem,
        disparo: data.disparo,
        agenciaId: data.agenciaId ?? null,
        sucesso: data.sucesso,
        erro: data.erro ?? null,
      },
    });
    return this.toDomain(record);
  }

  async listar(
    filtros: ListarEmailLogsFiltros,
  ): Promise<{ items: EmailLogListItem[]; total: number }> {
    const where = {
      ...(filtros.agenciaId ? { agenciaId: filtros.agenciaId } : {}),
      ...(filtros.destinatario
        ? { destinatario: { contains: filtros.destinatario, mode: "insensitive" as const } }
        : {}),
      ...(filtros.disparo ? { disparo: filtros.disparo } : {}),
      ...(filtros.sucesso !== undefined ? { sucesso: filtros.sucesso } : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        orderBy: { enviadoEm: "desc" },
        skip: (filtros.page - 1) * filtros.pageSize,
        take: filtros.pageSize,
        include: { agencia: { select: { razaoSocial: true } } },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        log: this.toDomain(record),
        agenciaRazaoSocial: record.agencia?.razaoSocial ?? null,
      })),
      total,
    };
  }

  async findById(id: string): Promise<EmailLog | null> {
    const record = await this.prisma.emailLog.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: EmailLogRecord): EmailLog {
    return EmailLog.create({
      id: record.id,
      destinatario: record.destinatario,
      assunto: record.assunto,
      corpo: record.corpo,
      origem: record.origem,
      disparo: record.disparo as DisparoEmail,
      agenciaId: record.agenciaId,
      sucesso: record.sucesso,
      erro: record.erro,
      enviadoEm: record.enviadoEm,
    });
  }
}

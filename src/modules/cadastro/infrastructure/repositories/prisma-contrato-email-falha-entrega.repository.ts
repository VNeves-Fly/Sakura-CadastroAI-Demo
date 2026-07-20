import type {
  PrismaClient,
  ContratoEmailFalhaEntrega as ContratoEmailFalhaEntregaRecord,
} from "@prisma/client";
import { ContratoEmailFalhaEntrega } from "@/modules/cadastro/domain/entities/contrato-email-falha-entrega.entity";
import type { ContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/domain/repositories/contrato-email-falha-entrega-repository";

export class PrismaContratoEmailFalhaEntregaRepository implements ContratoEmailFalhaEntregaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(contratoId: string, email: string, motivo: string | null): Promise<void> {
    await this.prisma.contratoEmailFalhaEntrega.upsert({
      where: { contratoId_email: { contratoId, email } },
      update: { motivo },
      create: { contratoId, email, motivo },
    });
  }

  async findByContratoId(contratoId: string): Promise<ContratoEmailFalhaEntrega[]> {
    const records = await this.prisma.contratoEmailFalhaEntrega.findMany({
      where: { contratoId },
    });
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: ContratoEmailFalhaEntregaRecord): ContratoEmailFalhaEntrega {
    return ContratoEmailFalhaEntrega.create({
      id: record.id,
      contratoId: record.contratoId,
      email: record.email,
      motivo: record.motivo,
      criadoEm: record.criadoEm,
    });
  }
}

import type { PrismaClient, ContratoAssinatura as ContratoAssinaturaRecord } from "@prisma/client";
import { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

export class PrismaContratoAssinaturaRepository implements ContratoAssinaturaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(contratoId: string, email: string): Promise<void> {
    // update vazio de propósito: retry do D4Sign não pode reescrever o
    // assinadoEm original (ver contrato-assinatura-repository.ts).
    await this.prisma.contratoAssinatura.upsert({
      where: { contratoId_email: { contratoId, email } },
      update: {},
      create: { contratoId, email },
    });
  }

  async findByContratoId(contratoId: string): Promise<ContratoAssinatura[]> {
    const records = await this.prisma.contratoAssinatura.findMany({
      where: { contratoId },
    });
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: ContratoAssinaturaRecord): ContratoAssinatura {
    return ContratoAssinatura.create({
      id: record.id,
      contratoId: record.contratoId,
      email: record.email,
      assinadoEm: record.assinadoEm,
    });
  }
}

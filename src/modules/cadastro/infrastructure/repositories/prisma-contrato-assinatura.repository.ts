import type { PrismaClient, ContratoAssinatura as ContratoAssinaturaRecord } from "@prisma/client";
import { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

export class PrismaContratoAssinaturaRepository implements ContratoAssinaturaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async registrar(contratoId: string, email: string, keySigner?: string | null): Promise<void> {
    // Lê antes de escrever pra decidir se preserva o assinadoEm já
    // gravado (Prisma não tem um jeito declarativo de "seta só se null"
    // num único upsert) — baixa contenção (uma linha por contrato+email),
    // não vale a pena uma escrita condicional em SQL cru só por isso.
    const existente = await this.prisma.contratoAssinatura.findUnique({
      where: { contratoId_email: { contratoId, email } },
    });

    await this.prisma.contratoAssinatura.upsert({
      where: { contratoId_email: { contratoId, email } },
      update: {
        assinadoEm: existente?.assinadoEm ?? new Date(),
        ...(keySigner ? { keySigner } : {}),
      },
      create: { contratoId, email, assinadoEm: new Date(), keySigner: keySigner ?? null },
    });
  }

  async registrarDestinatario(
    contratoId: string,
    email: string,
    keySigner: string | null,
  ): Promise<void> {
    await this.prisma.contratoAssinatura.upsert({
      where: { contratoId_email: { contratoId, email } },
      update: keySigner ? { keySigner } : {},
      create: { contratoId, email, assinadoEm: null, keySigner },
    });
  }

  async findByContratoId(contratoId: string): Promise<ContratoAssinatura[]> {
    const records = await this.prisma.contratoAssinatura.findMany({
      where: { contratoId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async marcarRemocaoDoDocumento(
    contratoId: string,
    email: string,
    removido: boolean,
  ): Promise<void> {
    await this.prisma.contratoAssinatura.updateMany({
      where: { contratoId, email },
      data: { removidoDoDocumentoEm: removido ? new Date() : null },
    });
  }

  private toDomain(record: ContratoAssinaturaRecord): ContratoAssinatura {
    return ContratoAssinatura.create({
      id: record.id,
      contratoId: record.contratoId,
      email: record.email,
      assinadoEm: record.assinadoEm,
      keySigner: record.keySigner,
      removidoDoDocumentoEm: record.removidoDoDocumentoEm,
    });
  }
}

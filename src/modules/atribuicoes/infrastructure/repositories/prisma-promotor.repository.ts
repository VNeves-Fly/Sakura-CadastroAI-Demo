import type { PrismaClient, Promotor as PromotorRecord, PromotorBase } from "@prisma/client";
import { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";

type PromotorRecordComBases = PromotorRecord & { bases: PromotorBase[] };

function toDomain(record: PromotorRecordComBases): Promotor {
  return Promotor.create({
    id: record.id,
    sica: record.sica,
    nome: record.nome,
    gestor: record.gestor,
    email: record.email,
    telefone: record.telefone,
    link: record.link,
    linkExecutivoId: record.linkExecutivoId,
    bases: record.bases.map((base) => base.baseSigla),
  });
}

export class PrismaPromotorRepository implements PromotorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Promotor[]> {
    const records = await this.prisma.promotor.findMany({
      orderBy: { nome: "asc" },
      include: { bases: true },
    });
    return records.map(toDomain);
  }

  async findByLinkExecutivoId(uuid: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findFirst({
      where: { linkExecutivoId: { has: uuid } },
      include: { bases: true },
    });
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findUnique({
      where: { email },
      include: { bases: true },
    });
    return record ? toDomain(record) : null;
  }
}

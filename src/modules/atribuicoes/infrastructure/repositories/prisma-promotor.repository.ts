import type { PrismaClient, Promotor as PromotorRecord } from "@prisma/client";
import { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";

function toDomain(record: PromotorRecord): Promotor {
  return Promotor.create({
    id: record.id,
    sica: record.sica,
    nome: record.nome,
    gestor: record.gestor,
    email: record.email,
    telefone: record.telefone,
    link: record.link,
    linkExecutivoId: record.linkExecutivoId,
    base: record.base,
  });
}

export class PrismaPromotorRepository implements PromotorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Promotor[]> {
    const records = await this.prisma.promotor.findMany({ orderBy: { nome: "asc" } });
    return records.map(toDomain);
  }

  async findByLinkExecutivoId(uuid: string): Promise<Promotor | null> {
    const record = await this.prisma.promotor.findFirst({
      where: { linkExecutivoId: { has: uuid } },
    });
    return record ? toDomain(record) : null;
  }
}

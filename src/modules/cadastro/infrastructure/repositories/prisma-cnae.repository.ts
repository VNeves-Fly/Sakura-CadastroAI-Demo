import type { PrismaClient, Cnae as CnaeRecord } from "@prisma/client";
import { Cnae } from "@/modules/cadastro/domain/entities/cnae.entity";
import type {
  CnaeRepository,
  CreateCnaeData,
} from "@/modules/cadastro/domain/repositories/cnae-repository";

export class PrismaCnaeRepository implements CnaeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDadosReceitaId(dadosReceitaId: string): Promise<Cnae[]> {
    const records = await this.prisma.cnae.findMany({
      where: { dadosReceitaId },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateCnaeData): Promise<Cnae> {
    const record = await this.prisma.cnae.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: CnaeRecord): Cnae {
    return Cnae.create({
      id: record.id,
      dadosReceitaId: record.dadosReceitaId,
      codigo: record.codigo,
      descricao: record.descricao,
      principal: record.principal,
    });
  }
}

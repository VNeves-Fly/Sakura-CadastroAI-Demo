import type { PrismaClient, Conjuge as ConjugeRecord } from "@prisma/client";
import { Conjuge } from "@/modules/cadastro/domain/entities/conjuge.entity";
import type {
  ConjugeRepository,
  CreateConjugeData,
  UpdateConjugeData,
} from "@/modules/cadastro/domain/repositories/conjuge-repository";

export class PrismaConjugeRepository implements ConjugeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByRepresentanteLegalId(representanteLegalId: string): Promise<Conjuge | null> {
    const record = await this.prisma.conjuge.findUnique({
      where: { representanteLegalId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateConjugeData): Promise<Conjuge> {
    const record = await this.prisma.conjuge.create({ data });
    return this.toDomain(record);
  }

  async update(representanteLegalId: string, data: UpdateConjugeData): Promise<Conjuge> {
    const record = await this.prisma.conjuge.update({
      where: { representanteLegalId },
      data,
    });
    return this.toDomain(record);
  }

  private toDomain(record: ConjugeRecord): Conjuge {
    return Conjuge.create({
      id: record.id,
      representanteLegalId: record.representanteLegalId,
      nome: record.nome,
      cpf: record.cpf,
      rg: record.rg,
      nacionalidade: record.nacionalidade,
    });
  }
}

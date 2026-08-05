import type { PrismaClient, Base as BaseRecord } from "@prisma/client";
import { Base } from "@/modules/bases/domain/entities/base.entity";
import type {
  AtualizarBaseData,
  BaseRepository,
  CriarBaseData,
} from "@/modules/bases/domain/repositories/base-repository";

function toDomain(record: BaseRecord): Base {
  return Base.create({
    id: record.id,
    sigla: record.sigla,
    nomeCidade: record.nomeCidade,
    uf: record.uf,
    createdAt: record.createdAt,
  });
}

export class PrismaBaseRepository implements BaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Base[]> {
    const records = await this.prisma.base.findMany({ orderBy: { sigla: "asc" } });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Base | null> {
    const record = await this.prisma.base.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findBySigla(sigla: string): Promise<Base | null> {
    const record = await this.prisma.base.findUnique({ where: { sigla } });
    return record ? toDomain(record) : null;
  }

  async criar(data: CriarBaseData): Promise<Base> {
    const record = await this.prisma.base.create({
      data: { sigla: data.sigla, nomeCidade: data.nomeCidade, uf: data.uf },
    });
    return toDomain(record);
  }

  async atualizar(id: string, data: AtualizarBaseData): Promise<Base> {
    const record = await this.prisma.base.update({
      where: { id },
      data: { sigla: data.sigla, nomeCidade: data.nomeCidade, uf: data.uf },
    });
    return toDomain(record);
  }
}

import type { PrismaClient, Associacao as AssociacaoRecord } from "@prisma/client";
import { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";
import type {
  AssociacaoRepository,
  AtualizarAssociacaoData,
  CriarAssociacaoData,
} from "@/modules/atribuicoes/domain/repositories/associacao-repository";

function toDomain(record: AssociacaoRecord): Associacao {
  return Associacao.create({ id: record.id, nome: record.nome, ativo: record.ativo });
}

export class PrismaAssociacaoRepository implements AssociacaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Associacao[]> {
    const records = await this.prisma.associacao.findMany({ orderBy: { nome: "asc" } });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<Associacao | null> {
    const record = await this.prisma.associacao.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async criar(data: CriarAssociacaoData): Promise<Associacao> {
    const record = await this.prisma.associacao.create({
      data: { nome: data.nome, ativo: data.ativo },
    });
    return toDomain(record);
  }

  async atualizar(id: string, data: AtualizarAssociacaoData): Promise<Associacao> {
    const record = await this.prisma.associacao.update({
      where: { id },
      data: { nome: data.nome, ativo: data.ativo },
    });
    return toDomain(record);
  }
}

import type {
  Prisma,
  PrismaClient,
  HistoricoEdicaoCadastro as HistoricoEdicaoCadastroRecord,
} from "@prisma/client";
import {
  HistoricoEdicaoCadastro,
  type AlteracaoCampo,
} from "@/modules/cadastro/domain/entities/historico-edicao-cadastro.entity";
import type {
  CreateHistoricoEdicaoCadastroData,
  HistoricoEdicaoCadastroRepository,
} from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";

export class PrismaHistoricoEdicaoCadastroRepository implements HistoricoEdicaoCadastroRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateHistoricoEdicaoCadastroData): Promise<HistoricoEdicaoCadastro> {
    const record = await this.prisma.historicoEdicaoCadastro.create({
      data: data as unknown as Prisma.HistoricoEdicaoCadastroUncheckedCreateInput,
    });
    return this.toDomain(record);
  }

  async findByEntidadeId(entidadeId: string): Promise<HistoricoEdicaoCadastro[]> {
    const records = await this.prisma.historicoEdicaoCadastro.findMany({
      where: { entidadeId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: HistoricoEdicaoCadastroRecord): HistoricoEdicaoCadastro {
    return HistoricoEdicaoCadastro.create({
      id: record.id,
      agenciaId: record.agenciaId,
      entidade: record.entidade,
      entidadeId: record.entidadeId,
      alteracoes: record.alteracoes as unknown as Record<string, AlteracaoCampo>,
      justificativa: record.justificativa,
      editadoPor: record.editadoPor,
      createdAt: record.createdAt,
    });
  }
}

import type { PrismaClient, ObservacaoCadastro as ObservacaoCadastroRecord } from "@prisma/client";
import { ObservacaoCadastro } from "@/modules/cadastro/domain/entities/observacao-cadastro.entity";
import type {
  CreateObservacaoCadastroData,
  ObservacaoCadastroRepository,
} from "@/modules/cadastro/domain/repositories/observacao-cadastro-repository";

export class PrismaObservacaoCadastroRepository implements ObservacaoCadastroRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateObservacaoCadastroData): Promise<ObservacaoCadastro> {
    const record = await this.prisma.observacaoCadastro.create({ data });
    return this.toDomain(record);
  }

  async findByAgenciaId(agenciaId: string): Promise<ObservacaoCadastro[]> {
    const records = await this.prisma.observacaoCadastro.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: ObservacaoCadastroRecord): ObservacaoCadastro {
    return ObservacaoCadastro.create({
      id: record.id,
      agenciaId: record.agenciaId,
      texto: record.texto,
      registradoPor: record.registradoPor,
      createdAt: record.createdAt,
    });
  }
}

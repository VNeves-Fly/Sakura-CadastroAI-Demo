import type { PrismaClient, DadosReceita as DadosReceitaRecord } from "@prisma/client";
import { DadosReceita } from "@/modules/cadastro/domain/entities/dados-receita.entity";
import type {
  CreateDadosReceitaData,
  DadosReceitaRepository,
  UpdateDadosReceitaData,
} from "@/modules/cadastro/domain/repositories/dados-receita-repository";

export class PrismaDadosReceitaRepository implements DadosReceitaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<DadosReceita | null> {
    const record = await this.prisma.dadosReceita.findUnique({
      where: { agenciaId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateDadosReceitaData): Promise<DadosReceita> {
    const record = await this.prisma.dadosReceita.create({ data });
    return this.toDomain(record);
  }

  async update(agenciaId: string, data: UpdateDadosReceitaData): Promise<DadosReceita> {
    const record = await this.prisma.dadosReceita.update({
      where: { agenciaId },
      data,
    });
    return this.toDomain(record);
  }

  private toDomain(record: DadosReceitaRecord): DadosReceita {
    return DadosReceita.create({
      id: record.id,
      agenciaId: record.agenciaId,
      situacaoCadastral: record.situacaoCadastral,
      dataAbertura: record.dataAbertura,
      naturezaJuridica: record.naturezaJuridica,
      porte: record.porte,
      capitalSocial: record.capitalSocial?.toNumber() ?? null,
      telefone: record.telefone,
      email: record.email,
      optanteSimples: record.optanteSimples,
      dataOpcaoSimples: record.dataOpcaoSimples,
      consultadoEm: record.consultadoEm,
    });
  }
}

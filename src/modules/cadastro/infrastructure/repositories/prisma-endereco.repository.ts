import type { PrismaClient, Endereco as EnderecoRecord } from "@prisma/client";
import { Endereco } from "@/modules/cadastro/domain/entities/endereco.entity";
import type {
  CreateEnderecoData,
  EnderecoRepository,
  UpdateEnderecoData,
} from "@/modules/cadastro/domain/repositories/endereco-repository";

export class PrismaEnderecoRepository implements EnderecoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Endereco | null> {
    const record = await this.prisma.endereco.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByDadosReceitaId(dadosReceitaId: string): Promise<Endereco | null> {
    const record = await this.prisma.endereco.findUnique({
      where: { dadosReceitaId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByCadastroComplementarId(cadastroComplementarId: string): Promise<Endereco | null> {
    const record = await this.prisma.endereco.findUnique({
      where: { cadastroComplementarId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByRepresentanteLegalId(representanteLegalId: string): Promise<Endereco | null> {
    const record = await this.prisma.endereco.findUnique({
      where: { representanteLegalId },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateEnderecoData): Promise<Endereco> {
    const record = await this.prisma.endereco.create({ data });
    return this.toDomain(record);
  }

  async update(id: string, data: UpdateEnderecoData): Promise<Endereco> {
    const record = await this.prisma.endereco.update({ where: { id }, data });
    return this.toDomain(record);
  }

  private toDomain(record: EnderecoRecord): Endereco {
    return Endereco.create({
      id: record.id,
      cep: record.cep,
      logradouro: record.logradouro,
      numero: record.numero,
      complemento: record.complemento,
      bairro: record.bairro,
      cidade: record.cidade,
      uf: record.uf,
      dadosReceitaId: record.dadosReceitaId,
      cadastroComplementarId: record.cadastroComplementarId,
      representanteLegalId: record.representanteLegalId,
    });
  }
}

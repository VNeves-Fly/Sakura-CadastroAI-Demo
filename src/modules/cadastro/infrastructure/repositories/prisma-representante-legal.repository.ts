import type { PrismaClient, RepresentanteLegal as RepresentanteLegalRecord } from "@prisma/client";
import { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type {
  CreateRepresentanteLegalData,
  RepresentanteLegalRepository,
  UpdateRepresentanteLegalData,
} from "@/modules/cadastro/domain/repositories/representante-legal-repository";

export class PrismaRepresentanteLegalRepository implements RepresentanteLegalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RepresentanteLegal | null> {
    const record = await this.prisma.representanteLegal.findUnique({
      where: { id },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByAgenciaId(agenciaId: string): Promise<RepresentanteLegal[]> {
    const records = await this.prisma.representanteLegal.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "asc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findByAgenciaIdAndCpf(agenciaId: string, cpf: string): Promise<RepresentanteLegal | null> {
    const record = await this.prisma.representanteLegal.findUnique({
      where: { agenciaId_cpf: { agenciaId, cpf } },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateRepresentanteLegalData): Promise<RepresentanteLegal> {
    const record = await this.prisma.representanteLegal.create({ data });
    return this.toDomain(record);
  }

  async update(id: string, data: UpdateRepresentanteLegalData): Promise<RepresentanteLegal> {
    const record = await this.prisma.representanteLegal.update({
      where: { id },
      data,
    });
    return this.toDomain(record);
  }

  private toDomain(record: RepresentanteLegalRecord): RepresentanteLegal {
    return RepresentanteLegal.create({
      id: record.id,
      agenciaId: record.agenciaId,
      nome: record.nome,
      email: record.email,
      telefone: record.telefone,
      cpf: record.cpf,
      cnpj: record.cnpj,
      isPj: record.isPj,
      rg: record.rg,
      rgOrgaoEmissor: record.rgOrgaoEmissor,
      dataNascimento: record.dataNascimento,
      estadoCivil: record.estadoCivil,
      regimeBens: record.regimeBens,
      nacionalidade: record.nacionalidade,
      cargo: record.cargo,
      papel: record.papel,
      isRepresentanteLegal: record.isRepresentanteLegal,
      administrativo: record.administrativo,
      ativo: record.ativo,
      origem: record.origem,
      preenchidoPorIa: record.preenchidoPorIa,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

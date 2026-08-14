import type {
  PrismaClient,
  RepresentanteLegal as RepresentanteLegalRecord,
  Endereco as EnderecoRecord,
} from "@prisma/client";
import { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { EnderecoData } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  CreateRepresentanteLegalData,
  RepresentanteLegalRepository,
  UpdateRepresentanteLegalData,
} from "@/modules/cadastro/domain/repositories/representante-legal-repository";

type RepresentanteLegalRecordComEndereco = RepresentanteLegalRecord & {
  endereco?: EnderecoRecord | null;
};

const ENDERECO_INCLUDE = { endereco: true } as const;

// Mesma conversão de prisma-agencia.repository.ts (record nullable ->
// EnderecoData sempre presente, strings vazias no lugar de null) — não
// extraído pra util compartilhado por ser uma função de 7 linhas.
function enderecoToDomain(record: EnderecoRecord | null | undefined): EnderecoData {
  if (!record) {
    return { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" };
  }
  return {
    cep: record.cep ?? "",
    logradouro: record.logradouro ?? "",
    numero: record.numero ?? "",
    complemento: record.complemento ?? "",
    bairro: record.bairro ?? "",
    cidade: record.cidade ?? "",
    uf: record.uf ?? "",
  };
}

export class PrismaRepresentanteLegalRepository implements RepresentanteLegalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<RepresentanteLegal | null> {
    const record = await this.prisma.representanteLegal.findUnique({
      where: { id },
      include: ENDERECO_INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByAgenciaId(agenciaId: string): Promise<RepresentanteLegal[]> {
    const records = await this.prisma.representanteLegal.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "asc" },
      include: ENDERECO_INCLUDE,
    });
    return records.map((record) => this.toDomain(record));
  }

  async findByAgenciaIdAndCpf(agenciaId: string, cpf: string): Promise<RepresentanteLegal | null> {
    const record = await this.prisma.representanteLegal.findFirst({
      where: { agenciaId, cpf },
      include: ENDERECO_INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateRepresentanteLegalData): Promise<RepresentanteLegal> {
    const record = await this.prisma.representanteLegal.create({ data });
    return this.toDomain(record);
  }

  async update(id: string, data: UpdateRepresentanteLegalData): Promise<RepresentanteLegal> {
    const { endereco, ...resto } = data;
    const record = await this.prisma.representanteLegal.update({
      where: { id },
      data: {
        ...resto,
        // Relação 1:1 opcional — o sócio pode não ter endereço ainda
        // (upsert em vez de update, senão falha pra quem nunca teve).
        ...(endereco && { endereco: { upsert: { create: endereco, update: endereco } } }),
      },
      include: ENDERECO_INCLUDE,
    });
    return this.toDomain(record);
  }

  private toDomain(record: RepresentanteLegalRecordComEndereco): RepresentanteLegal {
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
      endereco: enderecoToDomain(record.endereco),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

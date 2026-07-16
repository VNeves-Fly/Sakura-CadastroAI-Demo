import type { PrismaClient } from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { Socio } from "@/modules/cadastro/domain/entities/socio";
import type {
  AgenciaRepository,
  CreateAgenciaData,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

interface AgenciaRecord {
  id: string;
  razaoSocial: string;
  cnpj: string;
  etapaAtual: number;
  status: string;
  contratoSocialPath: string;
  emailContato: string;
  telefoneContato: string;
  origem: string | null;
  socios: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaAgenciaRepository implements AgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCnpj(cnpj: string): Promise<Agencia | null> {
    const record = await this.prisma.agencia.findUnique({ where: { cnpj } });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateAgenciaData): Promise<Agencia> {
    const record = await this.prisma.agencia.create({
      data: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        contratoSocialPath: data.contratoSocialPath,
        emailContato: data.emailContato,
        telefoneContato: data.telefoneContato,
        origem: data.origem,
        socios: data.socios as unknown as object,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: AgenciaRecord): Agencia {
    return Agencia.create({
      id: record.id,
      razaoSocial: record.razaoSocial,
      cnpj: record.cnpj,
      etapaAtual: record.etapaAtual,
      status: record.status,
      contratoSocialPath: record.contratoSocialPath,
      emailContato: record.emailContato,
      telefoneContato: record.telefoneContato,
      origem: record.origem,
      socios: record.socios as unknown as Socio[],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

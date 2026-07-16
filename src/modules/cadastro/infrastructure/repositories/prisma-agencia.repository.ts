import type { PrismaClient } from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
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
    // Escrita aninhada do Prisma: Agencia + CadastroComplementar + Contrato
    // são criados numa única operação atômica, sem intervalo entre eles.
    const record = await this.prisma.agencia.create({
      data: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        contratoSocialPath: data.contratoSocialPath,
        emailContato: data.emailContato,
        telefoneContato: data.telefoneContato,
        origem: data.origem,
        complementar: {
          create: {
            dadosPorPasso: data.dadosComplementares as object,
          },
        },
        contratos: {
          create: {
            provedorId: data.contrato.provedorId,
            status: data.contrato.status,
            signatarios: data.contrato.signatarios as object,
          },
        },
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
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

import type { Prisma, PrismaClient } from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type {
  AgenciaRepository,
  CadastrosFunil,
  CadastrosKpis,
  CreateAgenciaData,
  ListarCadastrosFiltros,
  ListarCadastrosResult,
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

  async listar(filtros: ListarCadastrosFiltros): Promise<ListarCadastrosResult> {
    const where: Prisma.AgenciaWhereInput = {};

    if (filtros.busca) {
      const buscaLimpa = filtros.busca.trim();
      const somenteDigitos = buscaLimpa.replace(/\D/g, "");
      where.OR = [
        { razaoSocial: { contains: buscaLimpa, mode: "insensitive" } },
        { emailContato: { contains: buscaLimpa, mode: "insensitive" } },
        ...(somenteDigitos ? [{ cnpj: { contains: somenteDigitos } }] : []),
      ];
    }

    if (filtros.etapa !== undefined) {
      where.etapaAtual = Array.isArray(filtros.etapa) ? { in: filtros.etapa } : filtros.etapa;
    }

    const [records, total] = await Promise.all([
      this.prisma.agencia.findMany({
        where,
        orderBy: { [filtros.sortBy ?? "createdAt"]: filtros.sortDir ?? "desc" },
      }),
      this.prisma.agencia.count({ where }),
    ]);

    return { items: records.map((record) => this.toDomain(record)), total };
  }

  async obterKpis(): Promise<CadastrosKpis> {
    const [emAnalise, reprovadas, aprovadas, aguardandoAprovacaoFinal] = await Promise.all([
      this.prisma.agencia.count({ where: { etapaAtual: { in: [1, 2, 3, 4] } } }),
      this.prisma.agencia.count({ where: { status: "recusado" } }),
      this.prisma.agencia.count({ where: { status: "aprovado" } }),
      this.prisma.agencia.count({ where: { etapaAtual: 5, status: { not: "aprovado" } } }),
    ]);

    return { emAnalise, reprovadas, aprovadas, aguardandoAprovacaoFinal };
  }

  async obterFunil(): Promise<CadastrosFunil> {
    const [etapa1, etapa2, etapa3, etapa4] = await Promise.all([
      this.prisma.agencia.count({ where: { etapaAtual: 1 } }),
      this.prisma.agencia.count({ where: { etapaAtual: 2 } }),
      this.prisma.agencia.count({ where: { etapaAtual: 3 } }),
      this.prisma.agencia.count({ where: { etapaAtual: 4 } }),
    ]);

    return { etapa1, etapa2, etapa3, etapa4 };
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

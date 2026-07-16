import type { Prisma, PrismaClient } from "@prisma/client";
import { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import {
  STATUS_ATIVO,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_EM_COMPLEMENTAR,
  STATUS_RECUSADO,
  type AgenciaDetalhe,
  type AgenciaRepository,
  type CadastrosKpis,
  type ContratoSignatarioData,
  type CreateAgenciaData,
  type ListarCadastrosFiltros,
  type ListarCadastrosResult,
  type OrigemGeracaoContrato,
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

// Contrato.signatarios é um Json solto no schema — guardamos aqui um
// envelope { origemGeracao, lista } em vez de só o array, pra rastrear
// quem gerou o contrato (IA ou analista) sem precisar de coluna nova.
interface SignatariosEnvelope {
  origemGeracao?: OrigemGeracaoContrato;
  lista?: ContratoSignatarioData[];
}

function extrairOrigemGeracao(signatarios: unknown): OrigemGeracaoContrato | null {
  const envelope = signatarios as SignatariosEnvelope | null;
  return envelope?.origemGeracao ?? null;
}

export class PrismaAgenciaRepository implements AgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCnpj(cnpj: string): Promise<Agencia | null> {
    const record = await this.prisma.agencia.findUnique({ where: { cnpj } });
    return record ? this.toDomain(record) : null;
  }

  async obterDetalhe(id: string): Promise<AgenciaDetalhe | null> {
    const record = await this.prisma.agencia.findUnique({
      where: { id },
      include: { complementar: true, contratos: { orderBy: { createdAt: "desc" } } },
    });

    if (!record) return null;

    return {
      agencia: this.toDomain(record),
      dadosComplementares: record.complementar?.dadosPorPasso ?? null,
      contratos: record.contratos.map((contrato) => ({
        id: contrato.id,
        provedorId: contrato.provedorId,
        status: contrato.status,
        origemGeracao: extrairOrigemGeracao(contrato.signatarios),
        createdAt: contrato.createdAt,
      })),
    };
  }

  async create(data: CreateAgenciaData): Promise<Agencia> {
    // Escrita aninhada do Prisma: Agencia + CadastroComplementar (+
    // Contrato, quando a IA já aprovou) são criados numa única operação
    // atômica, sem intervalo entre eles.
    const record = await this.prisma.agencia.create({
      data: {
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        status: data.status,
        contratoSocialPath: data.contratoSocialPath,
        emailContato: data.emailContato,
        telefoneContato: data.telefoneContato,
        origem: data.origem,
        complementar: {
          create: {
            dadosPorPasso: data.dadosComplementares as object,
          },
        },
        ...(data.contrato
          ? {
              contratos: {
                create: {
                  provedorId: data.contrato.provedorId,
                  status: data.contrato.status,
                  signatarios: {
                    origemGeracao: data.contrato.origemGeracao,
                    lista: data.contrato.signatarios,
                  } satisfies SignatariosEnvelope as object,
                },
              },
            }
          : {}),
      },
    });
    return this.toDomain(record);
  }

  async atualizarStatus(id: string, status: string): Promise<Agencia> {
    const record = await this.prisma.agencia.update({ where: { id }, data: { status } });
    return this.toDomain(record);
  }

  async criarContrato(
    agenciaId: string,
    data: {
      provedorId: string;
      status: string;
      origemGeracao: OrigemGeracaoContrato;
      signatarios: ContratoSignatarioData[];
    },
  ): Promise<void> {
    await this.prisma.contrato.create({
      data: {
        agenciaId,
        provedorId: data.provedorId,
        status: data.status,
        signatarios: {
          origemGeracao: data.origemGeracao,
          lista: data.signatarios,
        } satisfies SignatariosEnvelope as object,
      },
    });
  }

  async atualizarStatusContrato(contratoId: string, status: string): Promise<void> {
    await this.prisma.contrato.update({ where: { id: contratoId }, data: { status } });
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

    if (filtros.status !== undefined) {
      where.status = Array.isArray(filtros.status) ? { in: filtros.status } : filtros.status;
    }

    const [records, total] = await Promise.all([
      this.prisma.agencia.findMany({
        where,
        orderBy: { [filtros.sortBy ?? "createdAt"]: filtros.sortDir ?? "desc" },
        include: { contratos: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      this.prisma.agencia.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        agencia: this.toDomain(record),
        origemContratoAtual: extrairOrigemGeracao(record.contratos[0]?.signatarios ?? null),
      })),
      total,
    };
  }

  async obterKpis(): Promise<CadastrosKpis> {
    const [
      emComplementar,
      aguardandoAssinatura,
      aguardandoValidacao,
      aguardandoAtivacao,
      ativas,
      recusadas,
    ] = await Promise.all([
      this.prisma.agencia.count({ where: { status: STATUS_EM_COMPLEMENTAR } }),
      this.prisma.agencia.count({ where: { status: STATUS_AGUARDANDO_ASSINATURA } }),
      this.prisma.agencia.count({ where: { status: STATUS_AGUARDANDO_VALIDACAO } }),
      this.prisma.agencia.count({ where: { status: STATUS_AGUARDANDO_ATIVACAO } }),
      this.prisma.agencia.count({ where: { status: STATUS_ATIVO } }),
      this.prisma.agencia.count({ where: { status: STATUS_RECUSADO } }),
    ]);

    return {
      emComplementar,
      aguardandoAssinatura,
      aguardandoValidacao,
      aguardandoAtivacao,
      ativas,
      recusadas,
    };
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

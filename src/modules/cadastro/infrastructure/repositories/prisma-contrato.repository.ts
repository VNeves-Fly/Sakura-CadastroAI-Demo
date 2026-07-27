import type { PrismaClient, Contrato as ContratoRecord } from "@prisma/client";
import { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import { CONTRATO_STATUS_ASSINADO } from "@/modules/cadastro/domain/repositories/agencia-repository";
import type {
  ContratoRepository,
  CreateContratoData,
} from "@/modules/cadastro/domain/repositories/contrato-repository";
import type { OrigemGeracaoContrato, StatusContrato } from "@/modules/cadastro/domain/enums";

export class PrismaContratoRepository implements ContratoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Contrato | null> {
    const record = await this.prisma.contrato.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByAgenciaId(agenciaId: string): Promise<Contrato[]> {
    const records = await this.prisma.contrato.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateContratoData): Promise<Contrato> {
    const record = await this.prisma.contrato.create({ data });
    return this.toDomain(record);
  }

  async atualizarStatus(id: string, status: StatusContrato): Promise<Contrato> {
    const record = await this.prisma.contrato.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(record);
  }

  async confirmarLeitura(id: string, confirmadoPor: string): Promise<Contrato> {
    const record = await this.prisma.contrato.update({
      where: { id },
      data: {
        leituraConfirmada: true,
        leituraConfirmadaPor: confirmadoPor,
        leituraConfirmadaEm: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async registrarAssinatura(id: string, pdfAssinadoGcsPath: string): Promise<Contrato> {
    const record = await this.prisma.contrato.update({
      where: { id },
      data: {
        status: CONTRATO_STATUS_ASSINADO as StatusContrato,
        pdfAssinadoGcsPath,
        assinadoAt: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async atualizarProvedorId(
    id: string,
    data: { provedorId: string; origemGeracao: OrigemGeracaoContrato },
  ): Promise<Contrato> {
    const record = await this.prisma.contrato.update({
      where: { id },
      data: { provedorId: data.provedorId, origemGeracao: data.origemGeracao },
    });
    return this.toDomain(record);
  }

  private toDomain(record: ContratoRecord): Contrato {
    return Contrato.create({
      id: record.id,
      agenciaId: record.agenciaId,
      provedorId: record.provedorId,
      status: record.status,
      origemGeracao: record.origemGeracao,
      numContrato: record.numContrato,
      conteudoPreenchido: record.conteudoPreenchido,
      leituraConfirmada: record.leituraConfirmada,
      leituraConfirmadaPor: record.leituraConfirmadaPor,
      leituraConfirmadaEm: record.leituraConfirmadaEm,
      contratoGcsPath: record.contratoGcsPath,
      pdfAssinadoGcsPath: record.pdfAssinadoGcsPath,
      assinadoAt: record.assinadoAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

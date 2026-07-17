import type { PrismaClient, GateValidacao as GateValidacaoRecord } from "@prisma/client";
import { GateValidacao } from "@/modules/cadastro/domain/entities/gate-validacao.entity";
import type {
  CreateGateValidacaoData,
  GateValidacaoRepository,
} from "@/modules/cadastro/domain/repositories/gate-validacao-repository";

export class PrismaGateValidacaoRepository implements GateValidacaoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<GateValidacao[]> {
    const records = await this.prisma.gateValidacao.findMany({
      where: { agenciaId },
      orderBy: { avaliadoEm: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateGateValidacaoData): Promise<GateValidacao> {
    const record = await this.prisma.gateValidacao.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: GateValidacaoRecord): GateValidacao {
    return GateValidacao.create({
      id: record.id,
      agenciaId: record.agenciaId,
      etapaAlvo: record.etapaAlvo,
      liberado: record.liberado,
      motivoBloqueio: record.motivoBloqueio,
      avaliadoEm: record.avaliadoEm,
    });
  }
}

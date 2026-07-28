import type { PrismaClient } from "@prisma/client";
import type {
  AtendimentoAgenciaRepository,
  RegistroAtendimentoAgenciaAtivo,
  RegistroAtendimentoAgenciaAtual,
  RegistroAtendimentoAgenciaEncerrado,
  RegistroHistoricoAtendimentoAgencia,
} from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

export class PrismaAtendimentoAgenciaRepository implements AtendimentoAgenciaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAtual(agenciaId: string): Promise<RegistroAtendimentoAgenciaAtual | null> {
    const record = await this.prisma.atendimentoAgencia.findFirst({
      where: { agenciaId, liberadoEm: null },
      include: { analista: { select: { name: true } } },
      orderBy: { assumidoEm: "desc" },
    });
    if (!record) return null;
    return {
      id: record.id,
      analistaId: record.analistaId,
      analistaNome: record.analista.name,
      assumidoEm: record.assumidoEm,
    };
  }

  async criar(agenciaId: string, analistaId: string): Promise<void> {
    await this.prisma.atendimentoAgencia.create({ data: { agenciaId, analistaId } });
  }

  async liberar(registroId: string): Promise<void> {
    await this.prisma.atendimentoAgencia.update({
      where: { id: registroId },
      data: { liberadoEm: new Date() },
    });
  }

  async listarHistorico(
    agenciaId: string,
    limite = 10,
  ): Promise<RegistroHistoricoAtendimentoAgencia[]> {
    const registros = await this.prisma.atendimentoAgencia.findMany({
      where: { agenciaId },
      include: { analista: { select: { name: true } } },
      orderBy: { assumidoEm: "desc" },
      take: limite,
    });

    return registros.map((registro) => ({
      analistaNome: registro.analista.name,
      assumidoEm: registro.assumidoEm,
      liberadoEm: registro.liberadoEm,
    }));
  }

  async listarAtivosPorAgencias(agenciaIds: string[]): Promise<RegistroAtendimentoAgenciaAtivo[]> {
    if (agenciaIds.length === 0) return [];

    const registros = await this.prisma.atendimentoAgencia.findMany({
      where: { liberadoEm: null, agenciaId: { in: agenciaIds } },
      include: { analista: { select: { name: true } } },
      orderBy: { assumidoEm: "desc" },
    });

    return registros.map((registro) => ({
      agenciaId: registro.agenciaId,
      analistaId: registro.analistaId,
      analistaNome: registro.analista.name,
      assumidoEm: registro.assumidoEm,
    }));
  }

  async listarUltimoEncerradoPorAgencias(
    agenciaIds: string[],
  ): Promise<RegistroAtendimentoAgenciaEncerrado[]> {
    if (agenciaIds.length === 0) return [];

    const registros = await this.prisma.atendimentoAgencia.findMany({
      where: { liberadoEm: { not: null }, agenciaId: { in: agenciaIds } },
      include: { analista: { select: { name: true } } },
      orderBy: { liberadoEm: "desc" },
    });

    // Um registro por agência — o mais recente (já ordenado por
    // liberadoEm desc), primeira ocorrência vence.
    const porAgencia = new Map<string, RegistroAtendimentoAgenciaEncerrado>();
    for (const registro of registros) {
      if (porAgencia.has(registro.agenciaId)) continue;
      porAgencia.set(registro.agenciaId, {
        agenciaId: registro.agenciaId,
        analistaNome: registro.analista.name,
        assumidoEm: registro.assumidoEm,
        liberadoEm: registro.liberadoEm as Date,
      });
    }

    return [...porAgencia.values()];
  }
}

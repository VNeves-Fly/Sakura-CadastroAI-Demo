import type { PrismaClient } from "@prisma/client";
import type {
  AssumirAtendimentoRepository,
  RegistroAtendimentoAtivoPorAgencia,
  RegistroAtendimentoAtual,
  RegistroAtendimentoEncerradoPorAgencia,
} from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { AssumirAtendimentoRegistroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export class PrismaAssumirAtendimentoRepository implements AssumirAtendimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAtual(conversaId: string): Promise<RegistroAtendimentoAtual | null> {
    const record = await this.prisma.assumirAtendimentoRegistro.findFirst({
      where: { conversaId, liberadoEm: null },
      orderBy: { assumidoEm: "desc" },
    });
    if (!record) return null;
    return { id: record.id, analistaId: record.analistaId, assumidoEm: record.assumidoEm };
  }

  async criar(conversaId: string, analistaId: string): Promise<AssumirAtendimentoRegistroEntity> {
    const record = await this.prisma.assumirAtendimentoRegistro.create({
      data: { conversaId, analistaId },
      include: { analista: { select: { name: true } } },
    });
    return {
      analistaNome: record.analista.name,
      assumidoEm: record.assumidoEm.toISOString(),
      liberadoEm: null,
    };
  }

  async liberar(registroId: string): Promise<void> {
    await this.prisma.assumirAtendimentoRegistro.update({
      where: { id: registroId },
      data: { liberadoEm: new Date() },
    });
  }

  async listarAtivosPorAgencias(
    agenciaIds: string[],
  ): Promise<RegistroAtendimentoAtivoPorAgencia[]> {
    if (agenciaIds.length === 0) return [];

    const registros = await this.prisma.assumirAtendimentoRegistro.findMany({
      where: { liberadoEm: null, conversa: { agenciaId: { in: agenciaIds } } },
      include: { analista: { select: { name: true } }, conversa: { select: { agenciaId: true } } },
      orderBy: { assumidoEm: "desc" },
    });

    return registros
      .filter((registro) => registro.conversa.agenciaId !== null)
      .map((registro) => ({
        agenciaId: registro.conversa.agenciaId as string,
        conversaId: registro.conversaId,
        analistaNome: registro.analista.name,
        assumidoEm: registro.assumidoEm,
      }));
  }

  async listarUltimoEncerradoPorAgencias(
    agenciaIds: string[],
  ): Promise<RegistroAtendimentoEncerradoPorAgencia[]> {
    if (agenciaIds.length === 0) return [];

    const registros = await this.prisma.assumirAtendimentoRegistro.findMany({
      where: { liberadoEm: { not: null }, conversa: { agenciaId: { in: agenciaIds } } },
      include: { analista: { select: { name: true } }, conversa: { select: { agenciaId: true } } },
      orderBy: { liberadoEm: "desc" },
    });

    // Um registro por agência — o mais recente (já ordenado por
    // liberadoEm desc), primeira ocorrência vence.
    const porAgencia = new Map<string, RegistroAtendimentoEncerradoPorAgencia>();
    for (const registro of registros) {
      const agenciaId = registro.conversa.agenciaId;
      if (agenciaId === null || porAgencia.has(agenciaId)) continue;
      porAgencia.set(agenciaId, {
        agenciaId,
        conversaId: registro.conversaId,
        analistaNome: registro.analista.name,
        assumidoEm: registro.assumidoEm,
        liberadoEm: registro.liberadoEm as Date,
      });
    }

    return [...porAgencia.values()];
  }
}

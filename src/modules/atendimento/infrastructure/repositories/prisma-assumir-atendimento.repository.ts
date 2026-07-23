import type { PrismaClient } from "@prisma/client";
import type {
  AssumirAtendimentoRepository,
  RegistroAtendimentoAtual,
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
}

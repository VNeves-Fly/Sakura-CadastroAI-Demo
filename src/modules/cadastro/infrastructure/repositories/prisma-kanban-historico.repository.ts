import type { PrismaClient, KanbanHistorico as KanbanHistoricoRecord } from "@prisma/client";
import { KanbanHistorico } from "@/modules/cadastro/domain/entities/kanban-historico.entity";
import type {
  CreateKanbanHistoricoData,
  KanbanHistoricoRepository,
} from "@/modules/cadastro/domain/repositories/kanban-historico-repository";

export class PrismaKanbanHistoricoRepository implements KanbanHistoricoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByAgenciaId(agenciaId: string): Promise<KanbanHistorico[]> {
    const records = await this.prisma.kanbanHistorico.findMany({
      where: { agenciaId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.toDomain(record));
  }

  async create(data: CreateKanbanHistoricoData): Promise<KanbanHistorico> {
    const record = await this.prisma.kanbanHistorico.create({ data });
    return this.toDomain(record);
  }

  private toDomain(record: KanbanHistoricoRecord): KanbanHistorico {
    return KanbanHistorico.create({
      id: record.id,
      agenciaId: record.agenciaId,
      etapaAnterior: record.etapaAnterior,
      etapaNova: record.etapaNova,
      usuarioEmail: record.usuarioEmail,
      origem: record.origem,
      observacao: record.observacao,
      desbloqueioManual: record.desbloqueioManual,
      detalhes: record.detalhes,
      createdAt: record.createdAt,
    });
  }
}

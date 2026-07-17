import type { KanbanHistorico } from "@/modules/cadastro/domain/entities/kanban-historico.entity";

export interface CreateKanbanHistoricoData {
  agenciaId: string;
  etapaAnterior?: number | null;
  etapaNova?: number | null;
  usuarioEmail?: string | null;
  origem?: string | null;
  observacao?: string | null;
  desbloqueioManual?: boolean | null;
  detalhes?: string | null;
}

export interface KanbanHistoricoRepository {
  findByAgenciaId(agenciaId: string): Promise<KanbanHistorico[]>;
  create(data: CreateKanbanHistoricoData): Promise<KanbanHistorico>;
}

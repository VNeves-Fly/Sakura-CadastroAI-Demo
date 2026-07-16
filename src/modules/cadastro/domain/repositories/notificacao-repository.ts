import type { Notificacao } from "@/modules/cadastro/domain/entities/notificacao.entity";

export interface CreateNotificacaoData {
  agenciaId: string;
  tipo?: string | null;
  titulo?: string | null;
  mensagem?: string | null;
}

export interface NotificacaoRepository {
  findByAgenciaId(agenciaId: string): Promise<Notificacao[]>;
  create(data: CreateNotificacaoData): Promise<Notificacao>;
}

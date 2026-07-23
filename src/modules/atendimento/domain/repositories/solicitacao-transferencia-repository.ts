import type { SolicitacaoTransferenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-transferencia.entity";

export interface CriarSolicitacaoTransferenciaData {
  conversaId: string;
  deAnalistaId: string;
  paraAnalistaId: string;
}

export interface SolicitacaoTransferenciaAtual {
  id: string;
  paraAnalistaId: string;
  criadaEm: Date;
}

export interface SolicitacaoTransferenciaRepository {
  // A pendente (ou a última recusada/expirada ainda não "limpa") de uma
  // conversa — auto-expira uma PENDENTE vencida antes de devolver (ver
  // PrismaSolicitacaoTransferenciaRepository), então quem chama nunca
  // precisa calcular o timeout de novo.
  findVisivelPorConversa(conversaId: string): Promise<SolicitacaoTransferenciaEntity | null>;
  // Só a pendente (já expirada-se-vencida) — usado pra bloquear pedido
  // duplicado e pra validar quem pode responder.
  findPendentePorConversa(conversaId: string): Promise<SolicitacaoTransferenciaAtual | null>;
  criar(data: CriarSolicitacaoTransferenciaData): Promise<SolicitacaoTransferenciaEntity>;
  aceitar(id: string): Promise<void>;
  recusar(id: string): Promise<void>;
  limpar(conversaId: string): Promise<void>;
}

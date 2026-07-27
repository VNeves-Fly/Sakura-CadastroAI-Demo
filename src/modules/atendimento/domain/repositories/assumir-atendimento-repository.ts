import type { AssumirAtendimentoRegistroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface RegistroAtendimentoAtual {
  id: string;
  analistaId: string;
  assumidoEm: Date;
}

// Atendimento ativo (liberadoEm null) de uma conversa de uma agência
// específica — usado pra mostrar "quem está atendendo" na listagem de
// /cadastros, sem precisar carregar a conversa inteira.
export interface RegistroAtendimentoAtivoPorAgencia {
  agenciaId: string;
  conversaId: string;
  analistaNome: string;
  assumidoEm: Date;
}

export interface AssumirAtendimentoRepository {
  findAtual(conversaId: string): Promise<RegistroAtendimentoAtual | null>;
  criar(conversaId: string, analistaId: string): Promise<AssumirAtendimentoRegistroEntity>;
  liberar(registroId: string): Promise<void>;
  listarAtivosPorAgencias(agenciaIds: string[]): Promise<RegistroAtendimentoAtivoPorAgencia[]>;
}

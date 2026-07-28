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

// Último atendimento já encerrado (liberadoEm preenchido) de uma agência —
// usado como fallback na listagem de /cadastros quando não há ninguém
// atendendo no momento, pra mostrar quem foi o último a atender.
export interface RegistroAtendimentoEncerradoPorAgencia {
  agenciaId: string;
  conversaId: string;
  analistaNome: string;
  assumidoEm: Date;
  liberadoEm: Date;
}

export interface AssumirAtendimentoRepository {
  findAtual(conversaId: string): Promise<RegistroAtendimentoAtual | null>;
  criar(conversaId: string, analistaId: string): Promise<AssumirAtendimentoRegistroEntity>;
  liberar(registroId: string): Promise<void>;
  listarAtivosPorAgencias(agenciaIds: string[]): Promise<RegistroAtendimentoAtivoPorAgencia[]>;
  listarUltimoEncerradoPorAgencias(
    agenciaIds: string[],
  ): Promise<RegistroAtendimentoEncerradoPorAgencia[]>;
}

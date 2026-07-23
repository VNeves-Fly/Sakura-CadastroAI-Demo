import type { AssumirAtendimentoRegistroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface RegistroAtendimentoAtual {
  id: string;
  analistaId: string;
  assumidoEm: Date;
}

export interface AssumirAtendimentoRepository {
  findAtual(conversaId: string): Promise<RegistroAtendimentoAtual | null>;
  criar(conversaId: string, analistaId: string): Promise<AssumirAtendimentoRegistroEntity>;
  liberar(registroId: string): Promise<void>;
}

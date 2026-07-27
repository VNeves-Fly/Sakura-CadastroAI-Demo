import type { ContatoAgenciaEntity } from "@/modules/atendimento/domain/entities/contato-agencia.entity";

// Fonte de dados pra lista de Contatos (aba em /atendimento) — diferente
// de ConversaRepository, que só conhece conversas já materializadas
// (mensagem trocada). Aqui listamos TODAS as agências cadastradas, com
// seus números de WhatsApp candidatos, tenham conversa ou não.
export interface AgenciaContatoRepository {
  listar(busca?: string): Promise<ContatoAgenciaEntity[]>;
  obterPorAgenciaId(agenciaId: string): Promise<ContatoAgenciaEntity | null>;
}

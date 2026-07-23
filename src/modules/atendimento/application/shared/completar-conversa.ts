import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import {
  RESUMO_FICHA_NAO_IDENTIFICADO,
  type ResumoFichaClienteRepository,
} from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";

// PrismaConversaRepository devolve resumoFicha/solicitacaoTransferenciaPendente
// como placeholder (ele só conhece as tabelas de Conversa/Mensagem/
// Atendimento) — toda use-case que devolve um ConversaEntity pro front
// precisa sobrepor os dois com o dado real antes de retornar. Centralizado
// aqui pra não repetir a mesma lógica nas 7 use-cases que fazem isso.
export async function completarConversa(
  conversa: ConversaEntity,
  resumoFichaClienteRepository: ResumoFichaClienteRepository,
  solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
): Promise<ConversaEntity> {
  const [resumoFicha, solicitacaoTransferenciaPendente] = await Promise.all([
    conversa.agenciaId
      ? resumoFichaClienteRepository.obterResumo(conversa.agenciaId)
      : Promise.resolve(RESUMO_FICHA_NAO_IDENTIFICADO),
    solicitacaoTransferenciaRepository.findVisivelPorConversa(conversa.id),
  ]);

  return { ...conversa, resumoFicha, solicitacaoTransferenciaPendente };
}

import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import {
  RESUMO_FICHA_NAO_IDENTIFICADO,
  type ResumoFichaClienteRepository,
} from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";

// PrismaConversaRepository devolve resumoFicha como placeholder (ele só
// conhece as tabelas de Conversa/Mensagem/Atendimento) — toda use-case que
// devolve um ConversaEntity pro front precisa sobrepor com o dado real
// antes de retornar. Centralizado aqui pra não repetir a mesma lógica nas
// use-cases que fazem isso. Pendência de transferência/assunção não é mais
// parte da ConversaEntity — vive só no store/toast globais de atendimento
// (useSolicitacoesAtendimentoAgenciaStore), chaveada por agenciaId.
export async function completarConversa(
  conversa: ConversaEntity,
  resumoFichaClienteRepository: ResumoFichaClienteRepository,
): Promise<ConversaEntity> {
  const resumoFicha = conversa.agenciaId
    ? await resumoFichaClienteRepository.obterResumo(conversa.agenciaId)
    : RESUMO_FICHA_NAO_IDENTIFICADO;

  return { ...conversa, resumoFicha };
}

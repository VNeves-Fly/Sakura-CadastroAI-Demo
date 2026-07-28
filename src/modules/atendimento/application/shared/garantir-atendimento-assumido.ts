import { ConflictError } from "@/modules/shared/domain/errors";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

// Trava real (não só de UI) reaproveitada por quem precisa garantir que só
// quem assumiu o atendimento da agência age sobre ela — server actions do
// dossiê (via AtendimentoController) e as use-cases de iniciar
// conversa/enviar mensagem aqui embaixo. Decisão do usuário, 2026-07-28:
// alterar/aprovar/reprovar o cadastro OU iniciar/continuar uma conversa com
// a agência exige atendimento assumido primeiro.
export async function garantirAtendimentoAssumido(
  atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
  agenciaId: string,
  analistaId: string,
): Promise<void> {
  const atual = await atendimentoAgenciaRepository.findAtual(agenciaId);
  if (!atual || atual.analistaId !== analistaId) {
    throw new ConflictError("Assuma o atendimento desta agência antes de agir.");
  }
}

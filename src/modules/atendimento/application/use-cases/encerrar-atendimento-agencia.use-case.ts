import { ConflictError } from "@/modules/shared/domain/errors";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { SolicitacaoAtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";

export class EncerrarAtendimentoAgenciaUseCase {
  constructor(
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
    private readonly solicitacaoAtendimentoAgenciaRepository: SolicitacaoAtendimentoAgenciaRepository,
  ) {}

  async execute(agenciaId: string, analistaId: string): Promise<void> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(agenciaId);
    if (!atual) throw new ConflictError("Nenhum analista está atendendo esta agência.");
    if (atual.analistaId !== analistaId) {
      throw new ConflictError("Só quem está atendendo pode encerrar.");
    }

    // Cancela qualquer pedido de transferência/assunção pendente antes de
    // liberar — sem isso, um pedido pairando poderia se efetivar sozinho
    // depois sobre um atendimento que já foi encerrado por este caminho.
    await this.solicitacaoAtendimentoAgenciaRepository.cancelarPendentesPorAgencia(agenciaId);
    await this.atendimentoAgenciaRepository.liberar(atual.id);
  }
}

import { ConflictError } from "@/modules/shared/domain/errors";
import { HORAS_LIMITE_ASSUMIR } from "@/modules/atendimento/domain/atendimento.constants";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

// Espelha AssumirAtendimentoUseCase (conversa), mas sobre a agência — não
// precisa de nenhuma Conversa existir (ex.: analista revisando um dossiê
// reprovado pela IA, sem falar com o cliente).
export class AssumirAtendimentoAgenciaUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  async execute(agenciaId: string, analistaId: string): Promise<void> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(agenciaId);

    if (atual) {
      if (atual.analistaId === analistaId) return;

      const horasDesdeAssumiu = (Date.now() - atual.assumidoEm.getTime()) / (1000 * 60 * 60);
      if (horasDesdeAssumiu <= HORAS_LIMITE_ASSUMIR) {
        throw new ConflictError(
          `Esta agência ainda está com outro analista há menos de ${HORAS_LIMITE_ASSUMIR}h.`,
        );
      }
      await this.atendimentoAgenciaRepository.liberar(atual.id);
    }

    await this.atendimentoAgenciaRepository.criar(agenciaId, analistaId);
  }
}

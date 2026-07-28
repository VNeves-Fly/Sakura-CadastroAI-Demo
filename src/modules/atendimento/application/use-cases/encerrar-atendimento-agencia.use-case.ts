import { ConflictError } from "@/modules/shared/domain/errors";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

export class EncerrarAtendimentoAgenciaUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  async execute(agenciaId: string, analistaId: string): Promise<void> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(agenciaId);
    if (!atual) throw new ConflictError("Nenhum analista está atendendo esta agência.");
    if (atual.analistaId !== analistaId) {
      throw new ConflictError("Só quem está atendendo pode encerrar.");
    }

    await this.atendimentoAgenciaRepository.liberar(atual.id);
  }
}

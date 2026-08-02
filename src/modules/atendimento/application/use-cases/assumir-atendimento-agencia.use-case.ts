import { ConflictError } from "@/modules/shared/domain/errors";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";

// "Iniciar atendimento" — só funciona quando ninguém está atendendo. Tomar
// de outro analista sempre passa pelo fluxo de pedido/confirmação
// (SolicitarAssuncaoAtendimentoAgenciaUseCase), nunca por aqui — não existe
// mais "puxar" direto depois de X horas de inatividade.
export class AssumirAtendimentoAgenciaUseCase {
  constructor(private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository) {}

  async execute(agenciaId: string, analistaId: string): Promise<void> {
    const atual = await this.atendimentoAgenciaRepository.findAtual(agenciaId);

    if (atual) {
      if (atual.analistaId === analistaId) return;
      throw new ConflictError(
        "Esta agência já está sendo atendida — use Assumir atendimento pra solicitar a troca.",
      );
    }

    await this.atendimentoAgenciaRepository.criar(agenciaId, analistaId);
  }
}

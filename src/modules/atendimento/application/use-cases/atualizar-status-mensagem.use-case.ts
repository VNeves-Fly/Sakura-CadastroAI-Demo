import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { AtualizarStatusMensagemInput } from "@/modules/atendimento/application/dto/atualizar-status-mensagem.dto";

export class AtualizarStatusMensagemUseCase {
  constructor(private readonly mensagemRepository: MensagemRepository) {}

  async execute(input: AtualizarStatusMensagemInput): Promise<void> {
    await this.mensagemRepository.atualizarStatusPorWaMessageId(input.waMessageId, input.status);
  }
}

import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";

export class MarcarComoLidaUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly mensagemRepository: MensagemRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
  ) {}

  async execute(conversaId: string): Promise<ConversaEntity> {
    await this.mensagemRepository.marcarClienteComoLidas(conversaId);

    const conversa = await this.conversaRepository.findById(conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    return completarConversa(conversa, this.resumoFichaClienteRepository);
  }
}

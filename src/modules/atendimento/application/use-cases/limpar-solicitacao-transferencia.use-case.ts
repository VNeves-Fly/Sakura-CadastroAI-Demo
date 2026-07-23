import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";

export class LimparSolicitacaoTransferenciaUseCase {
  constructor(
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
  ) {}

  async execute(conversaId: string): Promise<ConversaEntity> {
    await this.solicitacaoTransferenciaRepository.limpar(conversaId);

    const conversa = await this.conversaRepository.findById(conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

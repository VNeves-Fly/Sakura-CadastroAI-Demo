import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";

export class ListarConversasUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
  ) {}

  async execute(): Promise<ConversaEntity[]> {
    const conversas = await this.conversaRepository.findAll();

    return Promise.all(
      conversas.map((conversa) =>
        completarConversa(
          conversa,
          this.resumoFichaClienteRepository,
          this.solicitacaoTransferenciaRepository,
        ),
      ),
    );
  }
}

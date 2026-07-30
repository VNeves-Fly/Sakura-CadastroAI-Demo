import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import { podeCancelar } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitacaoAtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";
import type { ResolverSolicitacaoAtendimentoAgenciaInput } from "@/modules/atendimento/application/dto/resolver-solicitacao-atendimento-agencia.dto";

// O solicitante sempre pode cancelar o próprio pedido; na ASSUNCAO, quem
// está atendendo agora (destinatário) também pode cancelar — ver
// podeCancelar. Na TRANSFERENCIA o destinatário não tem essa opção, só
// Confirmar (ver ConfirmarSolicitacaoAtendimentoAgenciaUseCase).
export class CancelarSolicitacaoAtendimentoAgenciaUseCase {
  constructor(
    private readonly solicitacaoAtendimentoAgenciaRepository: SolicitacaoAtendimentoAgenciaRepository,
  ) {}

  async execute(
    input: ResolverSolicitacaoAtendimentoAgenciaInput,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity> {
    const solicitacao = await this.solicitacaoAtendimentoAgenciaRepository.findById(
      input.solicitacaoId,
    );
    if (!solicitacao) throw new NotFoundError("Solicitação de atendimento");
    if (!podeCancelar(solicitacao, input.analistaId)) {
      throw new ConflictError("Você não pode cancelar este pedido.");
    }

    return this.solicitacaoAtendimentoAgenciaRepository.resolver(input.solicitacaoId, "CANCELAR");
  }
}

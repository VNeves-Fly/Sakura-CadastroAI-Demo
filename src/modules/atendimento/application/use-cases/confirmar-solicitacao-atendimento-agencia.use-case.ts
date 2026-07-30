import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import { podeConfirmar } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitacaoAtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";
import type { ResolverSolicitacaoAtendimentoAgenciaInput } from "@/modules/atendimento/application/dto/resolver-solicitacao-atendimento-agencia.dto";

// Só o destinatário confirma (ver papelNaSolicitacao) — o timeout de 60s já
// leva ao mesmo efeito sozinho (ver PrismaSolicitacaoAtendimentoAgenciaRepository),
// então confirmar é só "acelerar" o que já ia acontecer.
export class ConfirmarSolicitacaoAtendimentoAgenciaUseCase {
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
    if (!podeConfirmar(solicitacao, input.analistaId)) {
      throw new ConflictError("Você não pode confirmar este pedido.");
    }

    return this.solicitacaoAtendimentoAgenciaRepository.resolver(input.solicitacaoId, "ACEITAR");
  }
}

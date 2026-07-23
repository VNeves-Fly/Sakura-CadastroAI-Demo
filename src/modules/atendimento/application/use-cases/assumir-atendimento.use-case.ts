import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import { HORAS_LIMITE_ASSUMIR } from "@/modules/atendimento/domain/atendimento.constants";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import type { AssumirAtendimentoInput } from "@/modules/atendimento/application/dto/assumir-atendimento.dto";

export class AssumirAtendimentoUseCase {
  constructor(
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
  ) {}

  async execute(input: AssumirAtendimentoInput): Promise<ConversaEntity> {
    const atual = await this.assumirAtendimentoRepository.findAtual(input.conversaId);

    if (atual) {
      const horasDesdeAssumiu = (Date.now() - atual.assumidoEm.getTime()) / (1000 * 60 * 60);
      if (horasDesdeAssumiu <= HORAS_LIMITE_ASSUMIR && atual.analistaId !== input.analistaId) {
        throw new ConflictError(
          `Esta conversa ainda está com outro analista há menos de ${HORAS_LIMITE_ASSUMIR}h.`,
        );
      }
      await this.assumirAtendimentoRepository.liberar(atual.id);
    }

    await this.assumirAtendimentoRepository.criar(input.conversaId, input.analistaId);

    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

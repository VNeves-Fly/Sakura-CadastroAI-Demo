import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import { HORAS_LIMITE_ASSUMIR } from "@/modules/atendimento/domain/atendimento.constants";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import { AssumirAtendimentoAgenciaUseCase } from "@/modules/atendimento/application/use-cases/assumir-atendimento-agencia.use-case";
import type { AssumirAtendimentoInput } from "@/modules/atendimento/application/dto/assumir-atendimento.dto";

export class AssumirAtendimentoUseCase {
  constructor(
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
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

    // Assumir uma conversa da agência também assume a responsabilidade
    // sobre a agência em si (dossiê) — reflete nos dois lugares. Melhor
    // esforço: uma falha aqui não pode derrubar o assumir da conversa, que
    // já aconteceu de verdade acima.
    if (conversa.agenciaId) {
      try {
        await new AssumirAtendimentoAgenciaUseCase(this.atendimentoAgenciaRepository).execute(
          conversa.agenciaId,
          input.analistaId,
        );
      } catch {
        // Ignorado de propósito — ver comentário acima.
      }
    }

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

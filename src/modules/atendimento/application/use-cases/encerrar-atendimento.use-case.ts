import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import { EncerrarAtendimentoAgenciaUseCase } from "@/modules/atendimento/application/use-cases/encerrar-atendimento-agencia.use-case";
import type { EncerrarAtendimentoInput } from "@/modules/atendimento/application/dto/encerrar-atendimento.dto";

export class EncerrarAtendimentoUseCase {
  constructor(
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
  ) {}

  async execute(input: EncerrarAtendimentoInput): Promise<ConversaEntity> {
    const atual = await this.assumirAtendimentoRepository.findAtual(input.conversaId);
    if (!atual) throw new ConflictError("Nenhum analista está atendendo esta conversa.");
    if (atual.analistaId !== input.analistaId) {
      throw new ConflictError("Só quem está atendendo pode encerrar.");
    }

    await this.assumirAtendimentoRepository.liberar(atual.id);

    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    // Espelha o encerramento na agência — só se for essa mesma conversa que
    // hoje representa o atendimento ativo dela (uma agência pode ter outra
    // conversa ainda em andamento com o mesmo analista, aí não encerra).
    // Melhor esforço: ver comentário equivalente em AssumirAtendimentoUseCase.
    if (conversa.agenciaId) {
      try {
        await new EncerrarAtendimentoAgenciaUseCase(this.atendimentoAgenciaRepository).execute(
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

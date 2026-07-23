import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import type { EncerrarAtendimentoInput } from "@/modules/atendimento/application/dto/encerrar-atendimento.dto";

export class EncerrarAtendimentoUseCase {
  constructor(
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
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

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

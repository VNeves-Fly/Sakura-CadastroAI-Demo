import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import type { ResponderTransferenciaInput } from "@/modules/atendimento/application/dto/responder-transferencia.dto";

export class ResponderTransferenciaUseCase {
  constructor(
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
  ) {}

  async execute(input: ResponderTransferenciaInput): Promise<ConversaEntity> {
    const pendente = await this.solicitacaoTransferenciaRepository.findPendentePorConversa(
      input.conversaId,
    );
    if (!pendente) throw new NotFoundError("Solicitação de transferência");
    if (pendente.paraAnalistaId !== input.analistaId) {
      throw new ConflictError("Você não é o destinatário desta solicitação de transferência.");
    }

    if (input.aceita) {
      await this.solicitacaoTransferenciaRepository.aceitar(pendente.id);
      const atual = await this.assumirAtendimentoRepository.findAtual(input.conversaId);
      if (atual) await this.assumirAtendimentoRepository.liberar(atual.id);
      await this.assumirAtendimentoRepository.criar(input.conversaId, input.analistaId);
    } else {
      await this.solicitacaoTransferenciaRepository.recusar(pendente.id);
    }

    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

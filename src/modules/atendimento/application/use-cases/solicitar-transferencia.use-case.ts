import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { AssumirAtendimentoRepository } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { SolicitacaoTransferenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-transferencia-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import type { SolicitarTransferenciaInput } from "@/modules/atendimento/application/dto/solicitar-transferencia.dto";

export class SolicitarTransferenciaUseCase {
  constructor(
    private readonly assumirAtendimentoRepository: AssumirAtendimentoRepository,
    private readonly solicitacaoTransferenciaRepository: SolicitacaoTransferenciaRepository,
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: SolicitarTransferenciaInput): Promise<ConversaEntity> {
    if (input.paraAnalistaId === input.deAnalistaId) {
      throw new DomainError("Não é possível transferir o atendimento pra você mesmo.");
    }

    const atual = await this.assumirAtendimentoRepository.findAtual(input.conversaId);
    if (!atual) throw new ConflictError("Nenhum analista está atendendo esta conversa.");
    if (atual.analistaId !== input.deAnalistaId) {
      throw new ConflictError("Só quem está atendendo pode transferir.");
    }

    const paraAnalista = await this.userRepository.findById(input.paraAnalistaId);
    if (!paraAnalista) throw new NotFoundError("Analista de destino");

    const pendente = await this.solicitacaoTransferenciaRepository.findPendentePorConversa(
      input.conversaId,
    );
    if (pendente) {
      throw new ConflictError(
        "Já existe uma solicitação de transferência pendente pra esta conversa.",
      );
    }

    await this.solicitacaoTransferenciaRepository.criar({
      conversaId: input.conversaId,
      deAnalistaId: input.deAnalistaId,
      paraAnalistaId: input.paraAnalistaId,
    });

    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    return completarConversa(
      conversa,
      this.resumoFichaClienteRepository,
      this.solicitacaoTransferenciaRepository,
    );
  }
}

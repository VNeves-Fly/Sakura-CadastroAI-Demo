import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { UserRepository } from "@/modules/users/domain/repositories/user-repository";
import type { AtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/atendimento-agencia-repository";
import type { SolicitacaoAtendimentoAgenciaRepository } from "@/modules/atendimento/domain/repositories/solicitacao-atendimento-agencia-repository";
import type { SolicitacaoAtendimentoAgenciaEntity } from "@/modules/atendimento/domain/entities/solicitacao-atendimento-agencia.entity";
import type { SolicitarTransferenciaAtendimentoAgenciaInput } from "@/modules/atendimento/application/dto/solicitar-transferencia-atendimento-agencia.dto";

// Só quem está atendendo a agência agora pode transferir — sempre pra um
// destino escolhido (nunca pra si mesmo). Diferente da ASSUNCAO, aqui quem
// abre o pedido é quem hoje detém o atendimento (solicitanteId ===
// atendenteAtualId), e quem fica com o atendimento se ACEITA é o destino
// escolhido (novoAtendenteId === paraAnalistaId).
export class SolicitarTransferenciaAtendimentoAgenciaUseCase {
  constructor(
    private readonly atendimentoAgenciaRepository: AtendimentoAgenciaRepository,
    private readonly solicitacaoAtendimentoAgenciaRepository: SolicitacaoAtendimentoAgenciaRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: SolicitarTransferenciaAtendimentoAgenciaInput,
  ): Promise<SolicitacaoAtendimentoAgenciaEntity> {
    if (input.paraAnalistaId === input.deAnalistaId) {
      throw new DomainError("Não é possível transferir o atendimento pra você mesmo.");
    }

    const atual = await this.atendimentoAgenciaRepository.findAtual(input.agenciaId);
    if (!atual) throw new ConflictError("Nenhum analista está atendendo esta agência.");
    if (atual.analistaId !== input.deAnalistaId) {
      throw new ConflictError("Só quem está atendendo pode transferir.");
    }

    const paraAnalista = await this.userRepository.findById(input.paraAnalistaId);
    if (!paraAnalista) throw new NotFoundError("Analista de destino");

    const pendente = await this.solicitacaoAtendimentoAgenciaRepository.findPendentePorAgencia(
      input.agenciaId,
    );
    if (pendente) {
      throw new ConflictError(
        "Já existe uma solicitação de atendimento pendente pra esta agência.",
      );
    }

    return this.solicitacaoAtendimentoAgenciaRepository.criar({
      agenciaId: input.agenciaId,
      tipo: "transferencia",
      solicitanteId: input.deAnalistaId,
      atendenteAtualId: input.deAnalistaId,
      novoAtendenteId: input.paraAnalistaId,
    });
  }
}

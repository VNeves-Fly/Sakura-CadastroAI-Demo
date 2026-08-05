import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";
import type { AssociacaoRepository } from "@/modules/atribuicoes/domain/repositories/associacao-repository";

export class GetAssociacaoByIdUseCase implements UseCase<string, Associacao> {
  constructor(private readonly associacaoRepository: AssociacaoRepository) {}

  async execute(id: string): Promise<Associacao> {
    const associacao = await this.associacaoRepository.findById(id);
    if (!associacao) {
      throw new NotFoundError("Associação");
    }
    return associacao;
  }
}

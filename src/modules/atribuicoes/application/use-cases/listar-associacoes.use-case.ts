import type { UseCase } from "@/modules/shared/application/use-case";
import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";
import type { AssociacaoRepository } from "@/modules/atribuicoes/domain/repositories/associacao-repository";

export class ListarAssociacoesUseCase implements UseCase<void, Associacao[]> {
  constructor(private readonly associacaoRepository: AssociacaoRepository) {}

  async execute(): Promise<Associacao[]> {
    return this.associacaoRepository.findAll();
  }
}

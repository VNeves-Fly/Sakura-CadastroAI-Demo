import type { UseCase } from "@/modules/shared/application/use-case";
import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";
import type { AssociacaoRepository } from "@/modules/atribuicoes/domain/repositories/associacao-repository";
import type { CreateAssociacaoInput } from "@/modules/associacoes/application/dto/create-associacao.dto";

export class CreateAssociacaoUseCase implements UseCase<CreateAssociacaoInput, Associacao> {
  constructor(private readonly associacaoRepository: AssociacaoRepository) {}

  async execute(input: CreateAssociacaoInput): Promise<Associacao> {
    return this.associacaoRepository.criar(input);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Associacao } from "@/modules/atribuicoes/domain/entities/associacao.entity";
import type { AssociacaoRepository } from "@/modules/atribuicoes/domain/repositories/associacao-repository";
import type { UpdateAssociacaoInput } from "@/modules/associacoes/application/dto/update-associacao.dto";

export interface UpdateAssociacaoUseCaseInput {
  id: string;
  data: UpdateAssociacaoInput;
}

export class UpdateAssociacaoUseCase implements UseCase<UpdateAssociacaoUseCaseInput, Associacao> {
  constructor(private readonly associacaoRepository: AssociacaoRepository) {}

  async execute({ id, data }: UpdateAssociacaoUseCaseInput): Promise<Associacao> {
    const atual = await this.associacaoRepository.findById(id);
    if (!atual) {
      throw new NotFoundError("Associação");
    }
    return this.associacaoRepository.atualizar(id, data);
  }
}

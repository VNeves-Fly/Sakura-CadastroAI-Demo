import type { UseCase } from "@/modules/shared/application/use-case";
import type { CidadeComercialRepository } from "@/modules/atribuicoes/domain/repositories/cidade-comercial-repository";
import type { TipoAtribuicao } from "@/modules/atribuicoes/types/atribuicao.types";

export interface SubstituirAtribuicaoInput {
  tipo: TipoAtribuicao;
  nomeAntigo: string;
  nomeNovo: string;
}

export class SubstituirAtribuicaoUseCase implements UseCase<SubstituirAtribuicaoInput, number> {
  constructor(private readonly cidadeComercialRepository: CidadeComercialRepository) {}

  async execute({ tipo, nomeAntigo, nomeNovo }: SubstituirAtribuicaoInput): Promise<number> {
    return this.cidadeComercialRepository.substituir(tipo, nomeAntigo, nomeNovo);
  }
}

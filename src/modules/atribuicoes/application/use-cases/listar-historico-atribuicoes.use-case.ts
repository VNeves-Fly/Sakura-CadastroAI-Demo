import type { UseCase } from "@/modules/shared/application/use-case";
import type { SubstituicaoHistorico } from "@/modules/atribuicoes/types/atribuicao.types";
import type { CidadeComercialRepository } from "@/modules/atribuicoes/domain/repositories/cidade-comercial-repository";

export class ListarHistoricoAtribuicoesUseCase implements UseCase<void, SubstituicaoHistorico[]> {
  constructor(private readonly cidadeComercialRepository: CidadeComercialRepository) {}

  async execute(): Promise<SubstituicaoHistorico[]> {
    return this.cidadeComercialRepository.listarHistorico();
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import type { CidadeComercial } from "@/modules/atribuicoes/domain/entities/cidade-comercial.entity";
import type { CidadeComercialRepository } from "@/modules/atribuicoes/domain/repositories/cidade-comercial-repository";

export class ListarCidadesComerciaisUseCase implements UseCase<void, CidadeComercial[]> {
  constructor(private readonly cidadeComercialRepository: CidadeComercialRepository) {}

  async execute(): Promise<CidadeComercial[]> {
    return this.cidadeComercialRepository.findAll();
  }
}

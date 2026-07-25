import type { UseCase } from "@/modules/shared/application/use-case";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";

export class ListarPromotoresUseCase implements UseCase<void, Promotor[]> {
  constructor(private readonly promotorRepository: PromotorRepository) {}

  async execute(): Promise<Promotor[]> {
    return this.promotorRepository.findAll();
  }
}

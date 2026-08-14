import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Promotor } from "@/modules/atribuicoes/domain/entities/promotor.entity";
import type { PromotorRepository } from "@/modules/atribuicoes/domain/repositories/promotor-repository";

export class GetPromotorByIdUseCase implements UseCase<string, Promotor> {
  constructor(private readonly promotorRepository: PromotorRepository) {}

  async execute(id: string): Promise<Promotor> {
    const promotor = await this.promotorRepository.findById(id);
    if (!promotor) {
      throw new NotFoundError("Executivo");
    }
    return promotor;
  }
}

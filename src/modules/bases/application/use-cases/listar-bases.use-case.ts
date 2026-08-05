import type { UseCase } from "@/modules/shared/application/use-case";
import type { Base } from "@/modules/bases/domain/entities/base.entity";
import type { BaseRepository } from "@/modules/bases/domain/repositories/base-repository";

export class ListarBasesUseCase implements UseCase<void, Base[]> {
  constructor(private readonly baseRepository: BaseRepository) {}

  async execute(): Promise<Base[]> {
    return this.baseRepository.findAll();
  }
}

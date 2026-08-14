import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Base } from "@/modules/bases/domain/entities/base.entity";
import type { BaseRepository } from "@/modules/bases/domain/repositories/base-repository";

export class GetBaseByIdUseCase implements UseCase<string, Base> {
  constructor(private readonly baseRepository: BaseRepository) {}

  async execute(id: string): Promise<Base> {
    const base = await this.baseRepository.findById(id);
    if (!base) {
      throw new NotFoundError("Base");
    }
    return base;
  }
}

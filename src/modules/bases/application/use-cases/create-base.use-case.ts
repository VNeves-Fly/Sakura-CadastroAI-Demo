import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError } from "@/modules/shared/domain/errors";
import type { Base } from "@/modules/bases/domain/entities/base.entity";
import type { BaseRepository } from "@/modules/bases/domain/repositories/base-repository";
import type { CreateBaseInput } from "@/modules/bases/application/dto/create-base.dto";

export class CreateBaseUseCase implements UseCase<CreateBaseInput, Base> {
  constructor(private readonly baseRepository: BaseRepository) {}

  async execute(input: CreateBaseInput): Promise<Base> {
    const existente = await this.baseRepository.findBySigla(input.sigla);
    if (existente) {
      throw new ConflictError("Já existe uma base com essa sigla.");
    }
    return this.baseRepository.criar(input);
  }
}

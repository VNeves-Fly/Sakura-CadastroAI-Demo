import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { Base } from "@/modules/bases/domain/entities/base.entity";
import type { BaseRepository } from "@/modules/bases/domain/repositories/base-repository";
import type { UpdateBaseInput } from "@/modules/bases/application/dto/update-base.dto";

export interface UpdateBaseUseCaseInput {
  id: string;
  data: UpdateBaseInput;
}

export class UpdateBaseUseCase implements UseCase<UpdateBaseUseCaseInput, Base> {
  constructor(private readonly baseRepository: BaseRepository) {}

  async execute({ id, data }: UpdateBaseUseCaseInput): Promise<Base> {
    const atual = await this.baseRepository.findById(id);
    if (!atual) {
      throw new NotFoundError("Base");
    }

    if (data.sigla !== atual.sigla) {
      const comEssaSigla = await this.baseRepository.findBySigla(data.sigla);
      if (comEssaSigla && comEssaSigla.id !== id) {
        throw new ConflictError("Já existe uma base com essa sigla.");
      }
    }

    return this.baseRepository.atualizar(id, data);
  }
}

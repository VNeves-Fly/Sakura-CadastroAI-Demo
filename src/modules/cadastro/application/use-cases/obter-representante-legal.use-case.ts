import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { RepresentanteLegalRepository } from "@/modules/cadastro/domain/repositories/representante-legal-repository";

export class ObterRepresentanteLegalUseCase implements UseCase<string, RepresentanteLegal> {
  constructor(private readonly representanteLegalRepository: RepresentanteLegalRepository) {}

  async execute(id: string): Promise<RepresentanteLegal> {
    const representante = await this.representanteLegalRepository.findById(id);

    if (!representante) {
      throw new NotFoundError("Representante legal");
    }

    return representante;
  }
}

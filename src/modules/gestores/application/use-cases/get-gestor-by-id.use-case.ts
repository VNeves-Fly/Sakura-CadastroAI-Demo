import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";
import type { GestorRepository } from "@/modules/gestores/domain/repositories/gestor-repository";

export class GetGestorByIdUseCase implements UseCase<string, Gestor> {
  constructor(private readonly gestorRepository: GestorRepository) {}

  async execute(id: string): Promise<Gestor> {
    const gestor = await this.gestorRepository.findById(id);
    if (!gestor) {
      throw new NotFoundError("Gestor");
    }
    return gestor;
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import type { Gestor } from "@/modules/gestores/domain/entities/gestor.entity";
import type { GestorRepository } from "@/modules/gestores/domain/repositories/gestor-repository";

export class ListarGestoresUseCase implements UseCase<void, Gestor[]> {
  constructor(private readonly gestorRepository: GestorRepository) {}

  async execute(): Promise<Gestor[]> {
    return this.gestorRepository.findAll();
  }
}

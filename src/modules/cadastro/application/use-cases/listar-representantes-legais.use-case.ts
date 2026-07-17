import type { UseCase } from "@/modules/shared/application/use-case";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { RepresentanteLegalRepository } from "@/modules/cadastro/domain/repositories/representante-legal-repository";

export class ListarRepresentantesLegaisUseCase implements UseCase<string, RepresentanteLegal[]> {
  constructor(private readonly representanteLegalRepository: RepresentanteLegalRepository) {}

  execute(agenciaId: string): Promise<RepresentanteLegal[]> {
    return this.representanteLegalRepository.findByAgenciaId(agenciaId);
  }
}

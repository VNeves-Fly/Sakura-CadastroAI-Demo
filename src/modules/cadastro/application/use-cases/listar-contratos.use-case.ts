import type { UseCase } from "@/modules/shared/application/use-case";
import type { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";

export class ListarContratosUseCase implements UseCase<string, Contrato[]> {
  constructor(private readonly contratoRepository: ContratoRepository) {}

  execute(agenciaId: string): Promise<Contrato[]> {
    return this.contratoRepository.findByAgenciaId(agenciaId);
  }
}

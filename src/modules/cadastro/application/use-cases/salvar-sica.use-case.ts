import type { UseCase } from "@/modules/shared/application/use-case";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface SalvarSicaInput {
  agenciaId: string;
  codigo: string;
  salvoPor: string;
}

export class SalvarSicaUseCase implements UseCase<SalvarSicaInput, Agencia> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  execute(input: SalvarSicaInput): Promise<Agencia> {
    return this.agenciaRepository.salvarSica(input.agenciaId, {
      codigo: input.codigo,
      salvoPor: input.salvoPor,
    });
  }
}

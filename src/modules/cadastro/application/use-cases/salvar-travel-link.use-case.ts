import type { UseCase } from "@/modules/shared/application/use-case";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface SalvarTravelLinkInput {
  agenciaId: string;
  criado: boolean;
  salvoPor: string;
}

export class SalvarTravelLinkUseCase implements UseCase<SalvarTravelLinkInput, Agencia> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  execute(input: SalvarTravelLinkInput): Promise<Agencia> {
    return this.agenciaRepository.salvarTravelLink(input.agenciaId, {
      criado: input.criado,
      salvoPor: input.salvoPor,
    });
  }
}

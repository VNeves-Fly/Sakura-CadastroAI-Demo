import type { UseCase } from "@/modules/shared/application/use-case";
import type { RepresentanteLegal } from "@/modules/cadastro/domain/entities/representante-legal.entity";
import type { RepresentanteLegalRepository } from "@/modules/cadastro/domain/repositories/representante-legal-repository";

export interface AtualizarRepresentanteLegalInput {
  id: string;
  administrativo: boolean | null;
}

// Ação do analista no painel: corrige o `administrativo` extraído pela IA
// do contrato social (ou marca manualmente, quando a IA não decidiu) —
// decide se o sócio entra na lista de signatarios do contrato (ver filtro
// em AnalisarCadastroUseCase/AprovarCadastroComplementarUseCase).
export class AtualizarRepresentanteLegalUseCase implements UseCase<
  AtualizarRepresentanteLegalInput,
  RepresentanteLegal
> {
  constructor(private readonly representanteLegalRepository: RepresentanteLegalRepository) {}

  execute(input: AtualizarRepresentanteLegalInput): Promise<RepresentanteLegal> {
    return this.representanteLegalRepository.update(input.id, {
      administrativo: input.administrativo,
    });
  }
}

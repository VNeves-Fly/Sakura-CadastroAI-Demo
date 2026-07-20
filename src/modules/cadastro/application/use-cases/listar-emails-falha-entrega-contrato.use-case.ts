import type { UseCase } from "@/modules/shared/application/use-case";
import type { ContratoEmailFalhaEntrega } from "@/modules/cadastro/domain/entities/contrato-email-falha-entrega.entity";
import type { ContratoEmailFalhaEntregaRepository } from "@/modules/cadastro/domain/repositories/contrato-email-falha-entrega-repository";

export class ListarEmailsFalhaEntregaContratoUseCase implements UseCase<
  string,
  ContratoEmailFalhaEntrega[]
> {
  constructor(
    private readonly contratoEmailFalhaEntregaRepository: ContratoEmailFalhaEntregaRepository,
  ) {}

  execute(contratoId: string): Promise<ContratoEmailFalhaEntrega[]> {
    return this.contratoEmailFalhaEntregaRepository.findByContratoId(contratoId);
  }
}

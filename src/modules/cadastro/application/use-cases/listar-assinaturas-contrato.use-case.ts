import type { UseCase } from "@/modules/shared/application/use-case";
import type { ContratoAssinatura } from "@/modules/cadastro/domain/entities/contrato-assinatura.entity";
import type { ContratoAssinaturaRepository } from "@/modules/cadastro/domain/repositories/contrato-assinatura-repository";

export class ListarAssinaturasContratoUseCase implements UseCase<string, ContratoAssinatura[]> {
  constructor(private readonly contratoAssinaturaRepository: ContratoAssinaturaRepository) {}

  execute(contratoId: string): Promise<ContratoAssinatura[]> {
    return this.contratoAssinaturaRepository.findByContratoId(contratoId);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Contrato } from "@/modules/cadastro/domain/entities/contrato.entity";
import type { ContratoRepository } from "@/modules/cadastro/domain/repositories/contrato-repository";

export class ObterContratoUseCase implements UseCase<string, Contrato> {
  constructor(private readonly contratoRepository: ContratoRepository) {}

  async execute(id: string): Promise<Contrato> {
    const contrato = await this.contratoRepository.findById(id);

    if (!contrato) {
      throw new NotFoundError("Contrato");
    }

    return contrato;
  }
}

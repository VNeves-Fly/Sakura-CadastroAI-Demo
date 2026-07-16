import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type {
  AgenciaDetalhe,
  AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";

export class ObterDetalheAgenciaUseCase implements UseCase<string, AgenciaDetalhe> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(id: string): Promise<AgenciaDetalhe> {
    const detalhe = await this.agenciaRepository.obterDetalhe(id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    return detalhe;
  }
}

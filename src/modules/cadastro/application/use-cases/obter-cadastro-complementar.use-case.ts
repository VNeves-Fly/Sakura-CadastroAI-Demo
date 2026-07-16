import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { CadastroComplementar } from "@/modules/cadastro/domain/entities/cadastro-complementar.entity";
import type { CadastroComplementarRepository } from "@/modules/cadastro/domain/repositories/cadastro-complementar-repository";

export class ObterCadastroComplementarUseCase implements UseCase<string, CadastroComplementar> {
  constructor(private readonly cadastroComplementarRepository: CadastroComplementarRepository) {}

  async execute(agenciaId: string): Promise<CadastroComplementar> {
    const complementar = await this.cadastroComplementarRepository.findByAgenciaId(agenciaId);

    if (!complementar) {
      throw new NotFoundError("Cadastro complementar");
    }

    return complementar;
  }
}

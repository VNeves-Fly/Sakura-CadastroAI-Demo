import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export class ListarSignatariosPadraoAtivosUseCase implements UseCase<void, SignatarioPadrao[]> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(): Promise<SignatarioPadrao[]> {
    return this.signatarioPadraoRepository.findAtivos();
  }
}

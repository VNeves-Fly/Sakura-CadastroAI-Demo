import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export class ObterSignatarioPadraoUseCase implements UseCase<string, SignatarioPadrao | null> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(id: string): Promise<SignatarioPadrao | null> {
    return this.signatarioPadraoRepository.findById(id);
  }
}

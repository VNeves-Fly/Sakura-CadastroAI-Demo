import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export class RestaurarSignatarioPadraoUseCase implements UseCase<string, void> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(id: string): Promise<void> {
    return this.signatarioPadraoRepository.restaurar(id);
  }
}

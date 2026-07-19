import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

// Soft delete (deletedAt) — reversível, ver RestaurarSignatarioPadraoUseCase.
export class RemoverSignatarioPadraoUseCase implements UseCase<string, void> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(id: string): Promise<void> {
    return this.signatarioPadraoRepository.softDelete(id);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type { SignatarioPadraoRepository } from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

// Todos, inclusive removidos (soft delete) — pra tela de gestão do
// admin. Ver ListarSignatariosPadraoAtivosUseCase pra só os ativos.
export class ListarSignatariosPadraoUseCase implements UseCase<void, SignatarioPadrao[]> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(): Promise<SignatarioPadrao[]> {
    return this.signatarioPadraoRepository.findAll();
  }
}

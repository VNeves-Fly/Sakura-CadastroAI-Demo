import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type {
  CreateSignatarioPadraoData,
  SignatarioPadraoRepository,
} from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export class CriarSignatarioPadraoUseCase implements UseCase<
  CreateSignatarioPadraoData,
  SignatarioPadrao
> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(data: CreateSignatarioPadraoData): Promise<SignatarioPadrao> {
    return this.signatarioPadraoRepository.create(data);
  }
}

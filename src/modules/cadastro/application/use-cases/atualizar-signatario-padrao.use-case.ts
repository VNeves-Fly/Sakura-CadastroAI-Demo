import type { UseCase } from "@/modules/shared/application/use-case";
import type { SignatarioPadrao } from "@/modules/cadastro/domain/entities/signatario-padrao.entity";
import type {
  SignatarioPadraoRepository,
  UpdateSignatarioPadraoData,
} from "@/modules/cadastro/domain/repositories/signatario-padrao-repository";

export interface AtualizarSignatarioPadraoInput {
  id: string;
  data: UpdateSignatarioPadraoData;
}

export class AtualizarSignatarioPadraoUseCase implements UseCase<
  AtualizarSignatarioPadraoInput,
  SignatarioPadrao
> {
  constructor(private readonly signatarioPadraoRepository: SignatarioPadraoRepository) {}

  execute(input: AtualizarSignatarioPadraoInput): Promise<SignatarioPadrao> {
    return this.signatarioPadraoRepository.update(input.id, input.data);
  }
}

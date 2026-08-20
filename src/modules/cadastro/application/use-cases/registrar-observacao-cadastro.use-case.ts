import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ObservacaoCadastro } from "@/modules/cadastro/domain/entities/observacao-cadastro.entity";
import type { ObservacaoCadastroRepository } from "@/modules/cadastro/domain/repositories/observacao-cadastro-repository";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface RegistrarObservacaoCadastroInput {
  agenciaId: string;
  texto: string;
  registradoPor: string;
}

export class RegistrarObservacaoCadastroUseCase implements UseCase<
  RegistrarObservacaoCadastroInput,
  ObservacaoCadastro
> {
  constructor(
    private readonly observacaoCadastroRepository: ObservacaoCadastroRepository,
    private readonly agenciaRepository: AgenciaRepository,
  ) {}

  async execute(input: RegistrarObservacaoCadastroInput): Promise<ObservacaoCadastro> {
    const agencia = await this.agenciaRepository.findById(input.agenciaId);
    if (!agencia) {
      throw new NotFoundError("Agência");
    }

    const texto = input.texto.trim();
    if (!texto) {
      throw new DomainError("Escreva alguma coisa antes de registrar a observação.");
    }

    return this.observacaoCadastroRepository.create({
      agenciaId: input.agenciaId,
      texto,
      registradoPor: input.registradoPor,
    });
  }
}

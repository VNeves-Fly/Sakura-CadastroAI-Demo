import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface AtualizarStatusCadastroInput {
  id: string;
  status: string;
}

// Transições simples de status, sem efeito colateral (marcar contrato
// como assinado, ativar cliente, recusar) — todas só mudam o status.
// A única transição com efeito colateral (aprovar manualmente e gerar
// contrato) tem use-case próprio: AprovarCadastroComplementarUseCase.
export class AtualizarStatusCadastroUseCase implements UseCase<
  AtualizarStatusCadastroInput,
  Agencia
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(input: AtualizarStatusCadastroInput): Promise<Agencia> {
    const detalhe = await this.agenciaRepository.obterDetalhe(input.id);

    if (!detalhe) {
      throw new NotFoundError("Agência");
    }

    return this.agenciaRepository.atualizarStatus(input.id, input.status);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import type { ContatoAgenciaEntity } from "@/modules/atendimento/domain/entities/contato-agencia.entity";
import type { AgenciaContatoRepository } from "@/modules/atendimento/domain/repositories/agencia-contato-repository";

export interface ListarContatosInput {
  busca?: string;
}

// Alimenta a aba "Contatos" do /atendimento — todas as agências
// cadastradas (tenham conversa iniciada ou não), ordenadas por nome.
export class ListarContatosUseCase implements UseCase<ListarContatosInput, ContatoAgenciaEntity[]> {
  constructor(private readonly agenciaContatoRepository: AgenciaContatoRepository) {}

  execute(input: ListarContatosInput): Promise<ContatoAgenciaEntity[]> {
    return this.agenciaContatoRepository.listar(input.busca);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ContatoAgenciaEntity } from "@/modules/atendimento/domain/entities/contato-agencia.entity";
import type { AgenciaContatoRepository } from "@/modules/atendimento/domain/repositories/agencia-contato-repository";

export interface ObterContatoAgenciaInput {
  agenciaId: string;
}

// Alimenta o modal "com quem você quer falar" quando o analista chega em
// /atendimento a partir do botão "Atendimento" do dossiê (?agenciaId=).
export class ObterContatoAgenciaUseCase implements UseCase<
  ObterContatoAgenciaInput,
  ContatoAgenciaEntity
> {
  constructor(private readonly agenciaContatoRepository: AgenciaContatoRepository) {}

  async execute(input: ObterContatoAgenciaInput): Promise<ContatoAgenciaEntity> {
    const contato = await this.agenciaContatoRepository.obterPorAgenciaId(input.agenciaId);
    if (!contato) {
      throw new NotFoundError("Agência");
    }
    return contato;
  }
}

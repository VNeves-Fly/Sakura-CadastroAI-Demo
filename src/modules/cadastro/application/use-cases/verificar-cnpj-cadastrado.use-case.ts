import type { UseCase } from "@/modules/shared/application/use-case";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface VerificarCnpjCadastradoInput {
  cnpj: string;
}

export interface VerificarCnpjCadastradoOutput {
  existe: boolean;
}

// Aviso antecipado no preenchimento do wizard (antes do submit final) —
// só diz se já existe cadastro pra esse CNPJ, sem expor o status interno
// (em_complementar, aguardando_assinatura etc. ficam só no admin): um
// status detalhado aqui revelaria em que fase do processo uma empresa
// está pra qualquer um que soubesse o CNPJ dela. A checagem "de verdade"
// contra duplicidade continua em FinalizarCadastroUseCase — esta é só
// uma prévia pra dar feedback mais cedo ao usuário.
export class VerificarCnpjCadastradoUseCase implements UseCase<
  VerificarCnpjCadastradoInput,
  VerificarCnpjCadastradoOutput
> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(input: VerificarCnpjCadastradoInput): Promise<VerificarCnpjCadastradoOutput> {
    const existente = await this.agenciaRepository.findByCnpj(input.cnpj);
    return { existe: existente !== null };
  }
}

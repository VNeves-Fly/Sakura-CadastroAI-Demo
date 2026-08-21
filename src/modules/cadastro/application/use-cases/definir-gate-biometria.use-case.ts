import type { UseCase } from "@/modules/shared/application/use-case";
import type { Agencia } from "@/modules/cadastro/domain/entities/agencia.entity";
import type { AgenciaRepository } from "@/modules/cadastro/domain/repositories/agencia-repository";

export interface DefinirGateBiometriaInput {
  agenciaId: string;
  ativo: boolean;
}

// Liga/desliga o fluxo paralelo de biometria facial (Legitimuz) pra uma
// agência — precisa ser decidido antes da aprovação (em_analise/
// em_complementar), já que gerarEEnviar lê o valor na hora de montar o
// createlist/sendtosigner (ver docs/legitimuz/). Toggle admin/diretor na
// ficha do cadastro.
export class DefinirGateBiometriaUseCase implements UseCase<DefinirGateBiometriaInput, Agencia> {
  constructor(private readonly agenciaRepository: AgenciaRepository) {}

  async execute(input: DefinirGateBiometriaInput): Promise<Agencia> {
    return this.agenciaRepository.atualizarGateBiometria(input.agenciaId, input.ativo);
  }
}

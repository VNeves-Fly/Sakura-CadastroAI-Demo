import type { UseCase } from "@/modules/shared/application/use-case";
import type { ContratoSignatario } from "@/modules/cadastro/domain/entities/contrato-signatario.entity";
import type { ContratoSignatarioRepository } from "@/modules/cadastro/domain/repositories/contrato-signatario-repository";

export class ListarSignatariosContratoUseCase implements UseCase<string, ContratoSignatario[]> {
  constructor(private readonly contratoSignatarioRepository: ContratoSignatarioRepository) {}

  execute(contratoId: string): Promise<ContratoSignatario[]> {
    return this.contratoSignatarioRepository.findByContratoId(contratoId);
  }
}

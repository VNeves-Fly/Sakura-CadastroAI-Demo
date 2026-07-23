import type { UseCase } from "@/modules/shared/application/use-case";
import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";
import type { CriarTextoProntoInput } from "@/modules/atendimento/application/dto/criar-texto-pronto.dto";

export class CriarTextoProntoUseCase implements UseCase<CriarTextoProntoInput, TextoProntoEntity> {
  constructor(private readonly textoProntoRepository: TextoProntoRepository) {}

  execute(input: CriarTextoProntoInput): Promise<TextoProntoEntity> {
    return this.textoProntoRepository.create(input);
  }
}

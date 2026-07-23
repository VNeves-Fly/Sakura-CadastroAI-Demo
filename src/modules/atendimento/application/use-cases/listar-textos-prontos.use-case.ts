import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";

export class ListarTextosProntosUseCase {
  constructor(private readonly textoProntoRepository: TextoProntoRepository) {}

  execute(): Promise<TextoProntoEntity[]> {
    return this.textoProntoRepository.findAll();
  }
}

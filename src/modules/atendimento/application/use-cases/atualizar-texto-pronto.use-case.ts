import { NotFoundError } from "@/modules/shared/domain/errors";
import type { TextoProntoEntity } from "@/modules/atendimento/domain/entities/texto-pronto.entity";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";
import type { AtualizarTextoProntoInput } from "@/modules/atendimento/application/dto/atualizar-texto-pronto.dto";

export class AtualizarTextoProntoUseCase {
  constructor(private readonly textoProntoRepository: TextoProntoRepository) {}

  async execute(id: string, input: AtualizarTextoProntoInput): Promise<TextoProntoEntity> {
    const existente = await this.textoProntoRepository.findById(id);
    if (!existente) throw new NotFoundError("Texto pronto");

    return this.textoProntoRepository.update(id, input);
  }
}

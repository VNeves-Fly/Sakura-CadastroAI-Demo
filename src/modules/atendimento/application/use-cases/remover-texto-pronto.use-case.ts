import { NotFoundError } from "@/modules/shared/domain/errors";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";

export class RemoverTextoProntoUseCase {
  constructor(private readonly textoProntoRepository: TextoProntoRepository) {}

  async execute(id: string): Promise<void> {
    const existente = await this.textoProntoRepository.findById(id);
    if (!existente) throw new NotFoundError("Texto pronto");

    await this.textoProntoRepository.remover(id);
  }
}

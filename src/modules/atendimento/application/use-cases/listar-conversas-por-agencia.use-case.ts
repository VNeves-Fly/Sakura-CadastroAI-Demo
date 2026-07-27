import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";

export class ListarConversasPorAgenciaUseCase {
  constructor(private readonly conversaRepository: ConversaRepository) {}

  execute(agenciaId: string): Promise<ConversaEntity[]> {
    return this.conversaRepository.findAllByAgenciaId(agenciaId);
  }
}

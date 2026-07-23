import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import {
  RESUMO_FICHA_NAO_IDENTIFICADO,
  type ResumoFichaClienteRepository,
} from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";

export class ListarConversasUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
  ) {}

  async execute(): Promise<ConversaEntity[]> {
    const conversas = await this.conversaRepository.findAll();

    return Promise.all(
      conversas.map(async (conversa) => ({
        ...conversa,
        resumoFicha: conversa.agenciaId
          ? await this.resumoFichaClienteRepository.obterResumo(conversa.agenciaId)
          : RESUMO_FICHA_NAO_IDENTIFICADO,
      })),
    );
  }
}

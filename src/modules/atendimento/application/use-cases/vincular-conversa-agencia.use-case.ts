import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";
import { completarConversa } from "@/modules/atendimento/application/shared/completar-conversa";
import type { VincularConversaAgenciaInput } from "@/modules/atendimento/application/dto/vincular-conversa-agencia.dto";

// Liga uma conversa "não identificada" (número que não bateu com nenhum
// telefone cadastrado, ver WhatsAppContactMatcher) a uma agência já
// existente — decisão manual do analista quando o match automático não
// resolveu. O claim atômico mora no repository (só efetiva se a conversa
// ainda estiver com agenciaId null); aqui só confere que ela existe antes
// de tentar.
export class VincularConversaAgenciaUseCase {
  constructor(
    private readonly conversaRepository: ConversaRepository,
    private readonly resumoFichaClienteRepository: ResumoFichaClienteRepository,
  ) {}

  async execute(input: VincularConversaAgenciaInput): Promise<ConversaEntity> {
    const conversa = await this.conversaRepository.findById(input.conversaId);
    if (!conversa) throw new NotFoundError("Conversa");

    const vinculada = await this.conversaRepository.vincularAgencia(input.conversaId, {
      agenciaId: input.agenciaId,
      representanteLegalId: input.representanteLegalId,
      membroNome: input.membroNome,
      membroPapel: input.membroPapel,
    });

    return completarConversa(vinculada, this.resumoFichaClienteRepository);
  }
}

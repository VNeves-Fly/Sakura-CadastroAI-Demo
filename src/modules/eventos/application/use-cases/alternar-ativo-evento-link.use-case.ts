import type { UseCase } from "@/modules/shared/application/use-case";
import type { EventoLink } from "@/modules/eventos/domain/entities/evento-link.entity";
import type { EventoRepository } from "@/modules/eventos/domain/repositories/evento-repository";

export class AlternarAtivoEventoLinkUseCase implements UseCase<string, EventoLink> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(linkId: string): Promise<EventoLink> {
    return this.eventoRepository.alternarAtivoLink(linkId);
  }
}

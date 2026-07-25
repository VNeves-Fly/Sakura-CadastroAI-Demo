import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { EventoLink } from "@/modules/eventos/domain/entities/evento-link.entity";
import type {
  CriarEventoLinkData,
  EventoRepository,
} from "@/modules/eventos/domain/repositories/evento-repository";

export class CriarEventoLinkUseCase implements UseCase<CriarEventoLinkData, EventoLink> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(data: CriarEventoLinkData): Promise<EventoLink> {
    if (!data.promotorId && !data.associacaoId) {
      throw new DomainError("Selecione ao menos um executivo ou uma associação.");
    }

    const evento = await this.eventoRepository.findById(data.eventoId);
    if (!evento) throw new NotFoundError("Evento");

    const duplicado = await this.eventoRepository.existeLinkComMesmaCombinacao(data);
    if (duplicado) {
      throw new ConflictError("Já existe um link desse evento com essa mesma combinação.");
    }

    return this.eventoRepository.criarLink(data);
  }
}

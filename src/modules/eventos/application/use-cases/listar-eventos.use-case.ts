import type { UseCase } from "@/modules/shared/application/use-case";
import type {
  EventoComLinks,
  EventoRepository,
} from "@/modules/eventos/domain/repositories/evento-repository";

export class ListarEventosUseCase implements UseCase<void, EventoComLinks[]> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(): Promise<EventoComLinks[]> {
    return this.eventoRepository.listarComLinks();
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import type { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import type { EventoRepository } from "@/modules/eventos/domain/repositories/evento-repository";

export class ListarEventosUseCase implements UseCase<void, Evento[]> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(): Promise<Evento[]> {
    return this.eventoRepository.listar();
  }
}

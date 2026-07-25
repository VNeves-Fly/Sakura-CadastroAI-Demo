import type { UseCase } from "@/modules/shared/application/use-case";
import { DomainError } from "@/modules/shared/domain/errors";
import type { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import type { EventoRepository } from "@/modules/eventos/domain/repositories/evento-repository";

export class CriarEventoUseCase implements UseCase<string, Evento> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(nome: string): Promise<Evento> {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) throw new DomainError("Informe o nome do evento.");

    return this.eventoRepository.criar(nomeLimpo);
  }
}

import type { UseCase } from "@/modules/shared/application/use-case";
import { ConflictError, DomainError } from "@/modules/shared/domain/errors";
import { normalizarSlug, slugValido } from "@/modules/shared/utils/slug.util";
import type { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import type { EventoRepository } from "@/modules/eventos/domain/repositories/evento-repository";

export interface CriarEventoInput {
  nome: string;
  // Opcional — evento sem slug fica sem link público funcional até
  // alguém definir um (ver comentário no schema, model Evento).
  slug?: string | null;
}

export class CriarEventoUseCase implements UseCase<CriarEventoInput, Evento> {
  constructor(private readonly eventoRepository: EventoRepository) {}

  async execute(input: CriarEventoInput): Promise<Evento> {
    const nomeLimpo = input.nome.trim();
    if (!nomeLimpo) throw new DomainError("Informe o nome do evento.");

    const slugBruto = input.slug?.trim();
    let slug: string | null = null;

    if (slugBruto) {
      slug = normalizarSlug(slugBruto);
      if (!slug || !slugValido(slug)) {
        throw new DomainError(
          "Slug inválido — use apenas letras, números e hífens (ex.: summit-2026-sp).",
        );
      }

      const existente = await this.eventoRepository.findBySlug(slug);
      if (existente) throw new ConflictError(`Já existe um evento com o slug "${slug}".`);
    }

    return this.eventoRepository.criar({ nome: nomeLimpo, slug });
  }
}

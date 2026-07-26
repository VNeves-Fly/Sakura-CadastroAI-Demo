import type { Evento } from "@/modules/eventos/domain/entities/evento.entity";

export interface CriarEventoData {
  nome: string;
  slug: string | null;
}

export interface EventoRepository {
  listar(): Promise<Evento[]>;
  findById(id: string): Promise<Evento | null>;
  findBySlug(slug: string): Promise<Evento | null>;
  criar(data: CriarEventoData): Promise<Evento>;
}

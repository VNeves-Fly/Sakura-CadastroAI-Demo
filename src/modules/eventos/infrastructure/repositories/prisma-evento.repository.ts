import type { PrismaClient, Evento as EventoRecord } from "@prisma/client";
import { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import type {
  CriarEventoData,
  EventoRepository,
} from "@/modules/eventos/domain/repositories/evento-repository";

function eventoToDomain(record: EventoRecord): Evento {
  return Evento.create({
    id: record.id,
    nome: record.nome,
    slug: record.slug,
    ativo: record.ativo,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export class PrismaEventoRepository implements EventoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(): Promise<Evento[]> {
    const eventos = await this.prisma.evento.findMany({ orderBy: { createdAt: "desc" } });
    return eventos.map(eventoToDomain);
  }

  async findById(id: string): Promise<Evento | null> {
    const record = await this.prisma.evento.findUnique({ where: { id } });
    return record ? eventoToDomain(record) : null;
  }

  async findBySlug(slug: string): Promise<Evento | null> {
    const record = await this.prisma.evento.findUnique({ where: { slug } });
    return record ? eventoToDomain(record) : null;
  }

  async criar(data: CriarEventoData): Promise<Evento> {
    const record = await this.prisma.evento.create({
      data: { nome: data.nome, slug: data.slug },
    });
    return eventoToDomain(record);
  }
}

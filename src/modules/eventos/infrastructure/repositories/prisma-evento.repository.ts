import type {
  PrismaClient,
  Evento as EventoRecord,
  EventoLink as EventoLinkRecord,
} from "@prisma/client";
import { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import { EventoLink } from "@/modules/eventos/domain/entities/evento-link.entity";
import type {
  CriarEventoLinkData,
  EventoComLinks,
  EventoLinkResumo,
  EventoRepository,
} from "@/modules/eventos/domain/repositories/evento-repository";

function eventoToDomain(record: EventoRecord): Evento {
  return Evento.create({
    id: record.id,
    nome: record.nome,
    ativo: record.ativo,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function eventoLinkToDomain(record: EventoLinkRecord): EventoLink {
  return EventoLink.create({
    id: record.id,
    eventoId: record.eventoId,
    promotorId: record.promotorId,
    associacaoId: record.associacaoId,
    ativo: record.ativo,
    createdAt: record.createdAt,
  });
}

export class PrismaEventoRepository implements EventoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listarComLinks(): Promise<EventoComLinks[]> {
    const eventos = await this.prisma.evento.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        links: {
          orderBy: { createdAt: "desc" },
          include: {
            promotor: { select: { nome: true } },
            associacao: { select: { nome: true } },
          },
        },
      },
    });

    return Promise.all(
      eventos.map(async (evento) => {
        const links: EventoLinkResumo[] = await Promise.all(
          evento.links.map(async (link) => {
            const totalAgenciasCadastradas = await this.prisma.agencia.count({
              where: {
                eventoId: evento.id,
                executivoId: link.promotorId,
                associacaoId: link.associacaoId,
              },
            });

            return {
              id: link.id,
              eventoId: link.eventoId,
              promotorId: link.promotorId,
              promotorNome: link.promotor?.nome ?? null,
              associacaoId: link.associacaoId,
              associacaoNome: link.associacao?.nome ?? null,
              ativo: link.ativo,
              createdAt: link.createdAt,
              totalAgenciasCadastradas,
            };
          }),
        );

        return { evento: eventoToDomain(evento), links };
      }),
    );
  }

  async findById(id: string): Promise<Evento | null> {
    const record = await this.prisma.evento.findUnique({ where: { id } });
    return record ? eventoToDomain(record) : null;
  }

  async criar(nome: string): Promise<Evento> {
    const record = await this.prisma.evento.create({ data: { nome } });
    return eventoToDomain(record);
  }

  async criarLink(data: CriarEventoLinkData): Promise<EventoLink> {
    const record = await this.prisma.eventoLink.create({
      data: {
        eventoId: data.eventoId,
        promotorId: data.promotorId,
        associacaoId: data.associacaoId,
      },
    });
    return eventoLinkToDomain(record);
  }

  async existeLinkComMesmaCombinacao(data: CriarEventoLinkData): Promise<boolean> {
    const existente = await this.prisma.eventoLink.findFirst({
      where: {
        eventoId: data.eventoId,
        promotorId: data.promotorId,
        associacaoId: data.associacaoId,
      },
      select: { id: true },
    });
    return existente !== null;
  }

  async alternarAtivoLink(linkId: string): Promise<EventoLink> {
    const atual = await this.prisma.eventoLink.findUniqueOrThrow({ where: { id: linkId } });
    const record = await this.prisma.eventoLink.update({
      where: { id: linkId },
      data: { ativo: !atual.ativo },
    });
    return eventoLinkToDomain(record);
  }
}

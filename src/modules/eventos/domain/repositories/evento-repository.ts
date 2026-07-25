import type { Evento } from "@/modules/eventos/domain/entities/evento.entity";
import type { EventoLink } from "@/modules/eventos/domain/entities/evento-link.entity";

// Resumo de um link já com nome do promotor/associação resolvido (join)
// e a contagem de agências cadastradas por ele — casando
// Agencia.eventoId + executivoId + associacaoId com os mesmos campos do
// link (não existe FK de volta em Agencia pra um EventoLink específico).
export interface EventoLinkResumo {
  id: string;
  eventoId: string;
  promotorId: string | null;
  promotorNome: string | null;
  associacaoId: string | null;
  associacaoNome: string | null;
  ativo: boolean;
  createdAt: Date;
  totalAgenciasCadastradas: number;
}

export interface EventoComLinks {
  evento: Evento;
  links: EventoLinkResumo[];
}

export interface CriarEventoLinkData {
  eventoId: string;
  promotorId: string | null;
  associacaoId: string | null;
}

export interface EventoRepository {
  listarComLinks(): Promise<EventoComLinks[]>;
  findById(id: string): Promise<Evento | null>;
  criar(nome: string): Promise<Evento>;
  criarLink(data: CriarEventoLinkData): Promise<EventoLink>;
  // Combinação promotorId/associacaoId já usada por outro link do mesmo
  // evento — valida duplicidade antes de criar (ver CriarEventoLinkUseCase).
  existeLinkComMesmaCombinacao(data: CriarEventoLinkData): Promise<boolean>;
  alternarAtivoLink(linkId: string): Promise<EventoLink>;
}

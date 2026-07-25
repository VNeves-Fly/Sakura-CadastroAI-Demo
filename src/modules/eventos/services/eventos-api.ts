import type {
  Evento,
  EventoLink,
  CriarEventoInput,
  CriarEventoLinkInput,
} from "@/modules/eventos/types/evento.types";

interface RawEventoLink {
  id: string;
  eventoId: string;
  promotorId: string | null;
  promotorNome: string | null;
  associacaoId: string | null;
  associacaoNome: string | null;
  ativo: boolean;
  createdAt: string;
  totalAgenciasCadastradas: number;
}

interface RawEvento {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: string;
}

interface RawEventoComLinks {
  evento: RawEvento;
  links: RawEventoLink[];
}

async function tratarResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null);
    throw new Error(corpo?.error ?? "Não foi possível completar a operação.");
  }
  return resposta.json() as Promise<T>;
}

function paraEvento(raw: RawEventoComLinks): Evento {
  return {
    id: raw.evento.id,
    nome: raw.evento.nome,
    ativo: raw.evento.ativo,
    createdAt: raw.evento.createdAt,
    links: raw.links,
  };
}

export const eventosApi = {
  async listarEventos(): Promise<Evento[]> {
    const resposta = await fetch("/api/eventos");
    const raw = await tratarResposta<RawEventoComLinks[]>(resposta);
    return raw.map(paraEvento);
  },

  async criarEvento(input: CriarEventoInput): Promise<void> {
    const resposta = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    await tratarResposta<unknown>(resposta);
  },

  async criarEventoLink(input: CriarEventoLinkInput): Promise<void> {
    const resposta = await fetch(`/api/eventos/${input.eventoId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotorId: input.promotorId, associacaoId: input.associacaoId }),
    });
    await tratarResposta<unknown>(resposta);
  },

  async alternarAtivoLink(linkId: string): Promise<EventoLink> {
    const resposta = await fetch(`/api/eventos/links/${linkId}`, { method: "PATCH" });
    return tratarResposta<EventoLink>(resposta);
  },
};

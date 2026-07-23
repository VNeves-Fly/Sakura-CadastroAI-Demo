import type {
  Evento,
  EventoLink,
  Executivo,
  CriarEventoInput,
  CriarEventoLinkInput,
} from "@/modules/eventos/types/evento.types";
import { gerarEventosMock, gerarExecutivosMock } from "@/modules/eventos/mock/eventos-mock.data";
import { gerarSlugEventoLink } from "@/modules/eventos/utils/slug.util";

// Troque pelas chamadas reais (fetch pra uma rota /api/eventos/*) quando
// o back-end existir — hoje não existe nem a tabela de Evento/EventoLink
// nem o vínculo real com Agencia, então esse service só finge ser uma API
// (funções async, mesma assinatura que uma real teria) por cima de um
// "banco" em memória. Decisão explícita do usuário (2026-07-23): construir
// o front primeiro, back depois — mesma decisão já tomada pro /atendimento.

let eventos = gerarEventosMock();
const executivos = gerarExecutivosMock();

function atraso(ms = 150): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

function encontrarEventoOuFalhar(eventoId: string): Evento {
  const evento = eventos.find((item) => item.id === eventoId);
  if (!evento) throw new Error("Evento não encontrado.");
  return evento;
}

function encontrarLinkOuFalhar(linkId: string): { evento: Evento; link: EventoLink } {
  for (const evento of eventos) {
    const link = evento.links.find((item) => item.id === linkId);
    if (link) return { evento, link };
  }
  throw new Error("Link não encontrado.");
}

let proximoIdEvento = eventos.length + 1;
let proximoIdLink = eventos.reduce((total, evento) => total + evento.links.length, 0) + 1;

export const eventosApi = {
  async listarEventos(): Promise<Evento[]> {
    await atraso();
    return clonar(eventos).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async listarExecutivos(): Promise<Executivo[]> {
    await atraso();
    return clonar(executivos);
  },

  async criarEvento(input: CriarEventoInput): Promise<Evento> {
    await atraso();

    const nome = input.nome.trim();
    if (!nome) throw new Error("Informe o nome do evento.");

    const novoEvento: Evento = {
      id: `evento-${proximoIdEvento++}`,
      nome,
      ativo: true,
      createdAt: new Date().toISOString(),
      links: [],
    };

    eventos = [novoEvento, ...eventos];
    return clonar(novoEvento);
  },

  async criarEventoLink(input: CriarEventoLinkInput): Promise<Evento> {
    await atraso();

    const evento = encontrarEventoOuFalhar(input.eventoId);
    const executivo = executivos.find((item) => item.id === input.executivoId);
    if (!executivo) throw new Error("Executivo não encontrado.");

    const jaTemLinkParaEsteExecutivo = evento.links.some(
      (link) => link.executivoId === executivo.id,
    );
    if (jaTemLinkParaEsteExecutivo) {
      throw new Error("Este executivo já tem um link pra este evento.");
    }

    const slugBase = gerarSlugEventoLink(evento.nome, executivo.nome);
    const slugJaExiste = (slug: string) =>
      eventos.some((item) => item.links.some((link) => link.slug === slug));

    let slug = slugBase;
    let sufixo = 2;
    while (slugJaExiste(slug)) {
      slug = `${slugBase}-${sufixo}`;
      sufixo += 1;
    }

    const novoLink: EventoLink = {
      id: `link-${proximoIdLink++}`,
      eventoId: evento.id,
      executivoId: executivo.id,
      executivoNome: executivo.nome,
      slug,
      ativo: true,
      totalAgenciasCadastradas: 0,
      createdAt: new Date().toISOString(),
    };

    evento.links = [...evento.links, novoLink];
    return clonar(evento);
  },

  async alternarAtivoLink(linkId: string): Promise<Evento> {
    await atraso();

    const { evento, link } = encontrarLinkOuFalhar(linkId);
    link.ativo = !link.ativo;
    evento.links = evento.links.map((item) => (item.id === linkId ? link : item));
    return clonar(evento);
  },
};

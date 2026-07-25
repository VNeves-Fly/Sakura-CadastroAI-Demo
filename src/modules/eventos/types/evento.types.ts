// Domínio da página /painel/eventos — back-end real (ver
// eventos-admin.controller.ts): um Evento (ex.: "SUMMIT 2026 SP") agrupa
// vários EventoLink, cada um uma combinação de Executivo e/ou Associação
// que personaliza o cadastro público. Sem rota própria: o link é sempre
// a rota pública /cadastro com querystring
// (`?evento=&executivo=&associacao=`).

export interface Executivo {
  id: string;
  nome: string;
}

export interface AssociacaoOpcao {
  id: string;
  nome: string;
}

export interface EventoLink {
  id: string;
  eventoId: string;
  promotorId: string | null;
  promotorNome: string | null;
  associacaoId: string | null;
  associacaoNome: string | null;
  ativo: boolean;
  totalAgenciasCadastradas: number;
  createdAt: string;
}

export interface Evento {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt: string;
  links: EventoLink[];
}

export interface CriarEventoInput {
  nome: string;
}

export interface CriarEventoLinkInput {
  eventoId: string;
  promotorId: string | null;
  associacaoId: string | null;
}

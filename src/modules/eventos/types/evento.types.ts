// Domínio da página /painel/eventos — 100% mock front-end (ver
// eventos-api.ts). Um Evento (ex.: "SUMMIT 2026 SP") agrupa vários
// EventoLink, um por Executivo, cada um com slug público único
// (cadastroai.flysakura.com/{slug}) que — quando o back-end existir —
// vai travar o cadastro àquele executivo, gravando a tag na agência.

export interface Executivo {
  id: string;
  nome: string;
  email: string;
}

export interface EventoLink {
  id: string;
  eventoId: string;
  executivoId: string;
  executivoNome: string;
  slug: string;
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
  executivoId: string;
}

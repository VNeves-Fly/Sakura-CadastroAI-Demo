// Domínio da página /cadastros/eventos — back-end real (ver
// eventos-admin.controller.ts): um Evento (ex.: "SUMMIT 2026 SP") tem um
// slug único, usado no lugar do id bruto na rota pública /cadastro
// (`?evento=<slug>&executivo=&associacao=`). O link personalizado
// (executivo e/ou associação) é montado na hora — não tem tabela própria,
// nenhuma escrita no banco (ver montarUrlCadastroPersonalizado).

export interface Executivo {
  id: string;
  nome: string;
}

export interface AssociacaoOpcao {
  id: string;
  nome: string;
}

export interface Evento {
  id: string;
  nome: string;
  slug: string | null;
  ativo: boolean;
  createdAt: string;
}

export interface CriarEventoInput {
  nome: string;
  slug?: string | null;
}

// View da linha da tabela de Executivos (lista). Os campos de identidade
// (nome, gestor, bases, acesso) vêm de dado real (PromotorCrudView). As
// métricas de carteira abaixo NÃO têm fonte real hoje — não existe venda,
// limite de crédito ou "última compra" ligados a Agencia/Promotor no
// schema atual — então são geradas de forma determinística a partir do id
// (ver promotor-lista.adapter.ts) só pra a tela não nascer vazia. Trocar
// por agregação real assim que o backend expuser esse dado (SPEC seção 2.2).
export interface PromotorListaView {
  id: string;
  nome: string;
  gestorNome: string | null;
  bases: string[];
  temAcesso: boolean;
  // Real: deriva de bases/gestorId do próprio Promotor.
  semVinculo: boolean;
  // Mock: deriva de vendasAno === 0 (ver adapter).
  semVenda: boolean;
  // Mock front-end (ver promotor-status.store.ts) — default true. Distinto
  // de semVinculo: aqui é um status definido manualmente pelo botão
  // Inativar/Ativar da lista, não derivado de base/gestor.
  ativo: boolean;
  aprovadas: number;
  vendendo30d: number;
  paradas90d: number;
  vendasMes: number;
  vendasAno: number;
  limite: number;
  saudePercentual: number;
}

export interface PromotorListaFiltros {
  busca: string;
  esconderInativo: boolean;
  ocultarSemVendas: boolean;
}

// Paginação client-side da lista (pedido do usuário, 2026-08-19) — mesmo
// padrão de TAMANHO_PAGINA_AGENCIAS em agencia-carteira.types.ts.
export const TAMANHO_PAGINA_EXECUTIVOS = 25;

export type PromotorListaColunaOrdenavel =
  | "nome"
  | "gestorNome"
  | "aprovadas"
  | "vendendo30d"
  | "paradas90d"
  | "vendasMes"
  | "vendasAno"
  | "limite"
  | "saudePercentual";

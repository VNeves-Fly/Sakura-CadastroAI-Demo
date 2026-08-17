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

// Aba "Agências" do detalhe do Gestor (SPEC seção 8, specdetalhesgestor.md)
// — mesmo padrão de executivo-agencias.types.ts, com duas colunas a mais
// (Executivo/Base) porque a carteira do gestor soma vários executivos.
// Real: id, nome (razaoSocial), cnpj, status, executivoId/executivoNome,
// base (primeira base do executivo dono). O resto (categoria de premiação,
// vendas, bilhetes, ticket médio, dias sem comprar, limite) é mock
// determinístico, mesma filosofia das fases anteriores.
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type PeriodoVendas = "mes" | "30d" | "90d" | "ano";

export interface AgenciaDaGestaoView {
  id: string;
  nome: string;
  cnpj: string;
  executivoId: string;
  executivoNome: string;
  base: string | null;
  status: string;
  dadosFaltantes: boolean;
  inativada: boolean;
  categoria: CategoriaPremiacao;
  vendasAno: number;
  bilhetesAno: number;
  diasSemComprar: number;
  limite: number;
}

export interface AgenciasDaGestaoFiltros {
  busca: string;
  executivoId: "todos" | string;
  dadosFaltantes: "todos" | "pendentes";
  canalVendas: "todos" | "aereo" | "terrestre" | "ambos";
  premiacao: "todas" | CategoriaPremiacao;
  ultimaCompra: "qualquer" | "ate30" | "30a90" | "mais90";
  ordenarPor: "vendasAno" | "vendasPeriodo" | "ticketMedio" | "ultimaCompra";
  inativadasSakura: "ocultar" | "mostrar";
  periodo: PeriodoVendas;
}

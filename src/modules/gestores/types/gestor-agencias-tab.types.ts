// Aba "Agências" do detalhe do Gestor (SPEC seção 8, specdetalhesgestor.md)
// — mesmo padrão de executivo-agencias.types.ts, com duas colunas a mais
// (Executivo/Base) porque a carteira do gestor soma vários executivos.
// Real: id, nome (razaoSocial), cnpj, status, executivoId/executivoNome,
// base (primeira base do executivo dono). categoria/vendasAno/bilhetesAno/
// faixaRecencia/limite vêm do roster real do SST quando a agência casa por
// CNPJ com a carteira do executivo dono (ver gestor-agencias-tab.adapter.ts);
// sem match (executivo sem SICA, ou agência ainda não sincronizada no SST),
// cai no mesmo mock determinístico de sempre.
export type CategoriaPremiacao = "10K" | "100K" | "1M" | "10M";
export type PeriodoVendas = "mes" | "30d" | "90d" | "ano";
// Espelha FaixaRecenciaAgencia de executivo-detalhe.types.ts (duplicado por
// isolamento de módulo) — o SST não expõe data exata da última venda por
// agência, só presença/ausência dentro de janelas de 30/90/365 dias.
export type FaixaRecencia = "ate30d" | "30a90d" | "90a365d" | "semVenda365d";

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
  faixaRecencia: FaixaRecencia;
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

// Modelo de dados da página /crm/novas-agencias — módulo isolado e 100%
// mock (sem I/O real), reproduzindo a camada visual da SPEC recebida em
// 2026-08-21 (substitui a SPEC anterior de 2026-08-18 — ver
// novas-agencias.mock-service.ts). Nenhum destes tipos representa dado
// real da Sakura; os valores são literais, copiados da SPEC.

export type SituacaoAgenciaNova = "nunca" | "logou" | "comprando" | "parou";

export interface SituacaoConfig {
  label: string;
  bg: string;
  cor: string;
}

// Linha da tabela "Lista de agências" (SPEC 9.2) — só os campos exibidos
// (nome, meta, executivo, gerente, entrada, primeira compra, volume,
// situação) viram tipo; a SPEC lista outros campos no array de origem
// (dias, ultima, bilhetes, credito, creditoNota, pagamento) que "existem
// no modelo mas não são renderizados" — omitidos aqui de propósito, sem
// paridade a manter (nenhum consumidor os lê).
export interface AgenciaNovaLinha {
  id: string;
  nome: string;
  meta: string; // "10.000.000/0001-10 · ERP 40000 · São Paulo/SP"
  executivo: string;
  gerente: string;
  entrada: string; // já formatado, ex. "16/08/2026"
  primeiraCompra: string; // já formatado, ou "—"
  volume: string; // já formatado, ex. "R$ 0,00"
  situacao: SituacaoAgenciaNova;
}

export interface FunilAtivacaoKpis {
  novasAgencias: number;
  novasAgenciasPct: string; // "100% da base"
  nuncaCompraram: number;
  nuncaCompraramPct: string; // "78,7% da base"
  comprando: number;
  comprandoPct: string; // "21,3% da base"
  baseAprovadas: number; // 1224 — "base de 1.224 agências aprovadas"
}

export interface NovasAgenciasData {
  sincronizacao: { ultimaEm: string; distancia: string; proximaEm: string };
  funil: FunilAtivacaoKpis;
  volumeGerado: string; // "R$ 26,5 M"
  tempoMedioPrimeiraCompraDias: number;
  totalAgencias: number; // 28 — total da lista completa
  agencias: AgenciaNovaLinha[]; // 12 linhas renderizadas (SPEC 9.2)
}

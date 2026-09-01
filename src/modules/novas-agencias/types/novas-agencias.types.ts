// Modelo de dados da página /crm/novas-agencias. Demo 100% mock (sem
// Prisma/SST) — ver novas-agencias.loader.ts/adapter.ts.
//
// "logou" foi removido (decisão 2026-08-25): não existe fonte real de
// login/acesso de agência em lugar nenhum do sistema.

export type SituacaoAgenciaNova = "nunca" | "comprando" | "parou";

export interface SituacaoConfig {
  label: string;
  bg: string;
  cor: string;
}

// Linha da tabela "Lista de agências" — só os campos exibidos (nome,
// meta, executivo, gerente, entrada, primeira compra, volume, situação).
export interface AgenciaNovaLinha {
  id: string;
  nome: string;
  meta: string; // CNPJ real, ex. "10.000.000/0001-10" (sem ERP/cidade-UF — não há fonte real na Agencia local)
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
  baseAprovadas: number; // total histórico de agências com status "ativo" (não só as dos últimos 90 dias) — "base de N agências aprovadas"
}

export interface NovasAgenciasData {
  funil: FunilAtivacaoKpis;
  volumeGerado: string; // "R$ 26,5 M"
  tempoMedioPrimeiraCompraDias: number;
  agencias: AgenciaNovaLinha[]; // todas as agências aprovadas nos últimos 90 dias
}

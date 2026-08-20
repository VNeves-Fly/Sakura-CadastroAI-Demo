// Modelo de dados da página /crm/novas-agencias — módulo isolado e 100%
// mock (sem I/O real), reproduzindo só a camada visual da SPEC recebida
// (ver novas-agencias.mock-service.ts). Nenhum destes tipos representa
// dado real da Sakura.

export type SituacaoAgencia =
  "nunca_comprou" | "comprando" | "logou_nunca_comprou" | "parou_comprar";

export interface AgenciaNova {
  id: string;
  nome: string;
  cnpj: string;
  erp: string;
  cidade: string;
  uf: string;
  executivo: string;
  gerente: string;
  entrada: Date;
  primeiraCompra: Date | null;
  diasAtePrimeiraCompra: number | null;
  ultimaCompra: Date | null;
  bilhetes: number;
  volumeTotal: number;
  creditoValor: number;
  creditoDetalhe: string;
  formasPagamento: string | null;
  situacao: SituacaoAgencia;
}

export interface AgenciaParandoDeComprar {
  id: string;
  nome: string;
  cnpj: string;
  erp: string;
  cidade: string;
  uf: string;
  executivo: string;
  gerente: string;
  ultimaCompra: Date;
  diasSemComprar: number;
  pago30d: number;
  pago30a60d: number;
  volumeTotal: number;
}

export interface ResponsavelRanking {
  id: string;
  nome: string;
  novas: number;
  nuncaComprou: number;
  logouSemComprar: number;
  comprando: number;
  mais15d: number;
  mais30d: number;
  mais60d: number;
  conversaoPct: number;
  mediaAtePrimeiraCompraDias: number | null;
  volume: number;
}

export interface NovasAgenciasKpis {
  novasAgencias: number;
  nuncaCompraram: number;
  comprando: number;
  semComprar15d: number;
  semComprar30d: number;
  pararam60d: number;
  volumeGerado: number;
  pagoUltimos30d: number;
  variacao30dPct: number;
  tempoMedioPrimeiraCompraDias: number;
}

export interface MixPagamentoItem {
  label: string;
  valor: number;
  comTooltip?: boolean;
}

export interface CreditoResumo {
  comLimiteFaturado: number;
  semLimiteFaturado: number;
  limiteFaturadoTotal: number;
}

export interface SincronizacaoInfo {
  ultimaEm: Date;
  proximaEm: Date;
}

export interface NovasAgenciasData {
  kpis: NovasAgenciasKpis;
  mixPagamento: MixPagamentoItem[];
  totalPago: number;
  credito: CreditoResumo;
  sincronizacao: SincronizacaoInfo;
  agencias: AgenciaNova[];
  agenciasParandoDeComprar: AgenciaParandoDeComprar[];
  cobrancaPorResponsavel: {
    executivos: ResponsavelRanking[];
    gerentes: ResponsavelRanking[];
  };
}

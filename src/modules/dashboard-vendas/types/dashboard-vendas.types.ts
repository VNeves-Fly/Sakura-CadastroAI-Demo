// Modelo de dados da página /dashboard-new — módulo isolado e 100% mock
// (não existe base de vendas aéreas/terrestres neste projeto ainda, ver
// SPEC_Dashboard_Sakura.md). Estrutura calcada na seção 6 da spec, só
// tipos que já chegam prontos pra View consumir (a normalização de
// "cru" pra isto acontece no adapter, nunca aqui).

export type PeriodoResumo = "hoje" | "ontem" | "mes" | "ano";
export type Canal = "ambos" | "aereo" | "terrestre";

export interface CanalResumo {
  valor: number;
  quantidade: number;
  participacaoPct: number;
  margemPct: number;
}

export interface ResumoDia {
  atualizadoEm: Date;
  aereo: CanalResumo;
  terrestre: CanalResumo;
}

export interface MiniKpis {
  clientesDistintos: number;
  bilhetesAereo: number;
  ticketMedioAereo: number;
}

export interface BucketIntraday {
  horario: string; // "HH:mm"
  nacional: { valor: number; qtd: number };
  internacional: { valor: number; qtd: number };
  terrestre: { valor: number; qtd: number };
}

export interface ProjecaoDia {
  atualizadoEm: Date;
  percentualDiaTranscorrido: number;
  fechamentoEsperado: number;
  faixaMin: number;
  faixaMax: number;
  realizado: number;
  aEmitir: number;
  nacional: { projecao: number; realizado: number };
  internacional: { projecao: number; realizado: number };
  curva: Array<{
    hora: string;
    esperado: number;
    nacionalHoje: number | null;
    internacionalHoje: number | null;
  }>;
}

export interface HistoricoAcuraciaDia {
  dia: string;
  previsto: number;
  real: number;
}

export interface AcuraciaProjecao {
  erroMedioPct: number;
  historico: HistoricoAcuraciaDia[];
}

export interface GrupoRecencia {
  total: number;
  soAereo: number;
  soTerrestre: number;
  ambos: number;
}

export interface RecenciaAgencias {
  compraram30d: GrupoRecencia;
  compraramAno: GrupoRecencia;
  semVendas30dMais: {
    total: number;
    faixa31a89: number;
    faixa90a179: number;
    faixa180Mais: number;
  };
  semVendasAno: GrupoRecencia & {
    compraramAnoAnterior: number;
    compraramAnoAtual: number;
    soAnoAnterior: number;
  };
}

export interface ConversaoCanal {
  saudePct: number;
  volumeMesVarPct: number;
  bilhetesVendasMesVarPct: number;
  agenciasMesVarPct: number;
  periodoComparativo: string;
  aereoMes: { valor: number; bilhetes: number };
  terrestreMes: { valor: number; vendas: number };
}

export type Conversao = Record<Canal, ConversaoCanal>;

export interface VendaMensal {
  mes: string; // "Jan/26"
  aereoNacional: number;
  aereoInternacional: number;
  terrestre: number;
}

export interface VendaDiaria {
  data: string; // "DD/MM"
  aereo: number;
  terrestre: number;
}

export interface TopAgencia {
  posicao: number;
  nome: string;
  canal: Canal;
  valor: number;
  qtd: number;
}

export interface TopFornecedor {
  nome: string;
  qtdBilhetes: number;
  valor: number;
  participacaoPct: number;
}

export interface NacionalInternacional {
  nacional: { valor: number; bilhetes: number };
  internacional: { valor: number; bilhetes: number };
}

export interface CruzamentoCanais {
  totalAgenciasCarteira: number;
  ambos: { qtd: number; pct: number };
  soAereo: { qtd: number; pct: number };
  soTerrestre: { qtd: number; pct: number };
  nenhum: { qtd: number; pct: number };
}

export interface DashboardVendasData {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
  miniKpis: MiniKpis;
  intraday: BucketIntraday[];
  projecao: ProjecaoDia;
  acuracia: AcuraciaProjecao;
  recencia: RecenciaAgencias;
  conversao: Conversao;
  vendasMensais: VendaMensal[];
  vendasDiarias: VendaDiaria[];
  rankingPorMes: Record<string, TopAgencia[]>;
  fornecedoresPorMes: Record<string, TopFornecedor[]>;
  nacionalInternacionalPorMes: Record<string, NacionalInternacional>;
  cruzamentoCanais: CruzamentoCanais;
}

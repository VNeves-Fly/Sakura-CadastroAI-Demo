// Modelo de dados da página /crm/dashboard — módulo isolado e 100% mock
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
  // Share Nacional/Internacional (valor + bilhetes de cada lado, não só
  // %) — mostrado na barra embaixo dos cards Aéreo e Terrestre do Resumo
  // do dia, com tooltip ao passar o mouse; mesmo valor pros dois canais
  // (pedido do usuário, 2026-08-19).
  nacIntDetalhe: NacionalInternacional;
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
    realizadoHoje: number | null;
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

// Linha de detalhamento por agência dos 4 cards de recência (4.6) — o
// que o modal "Ver detalhes" lista. `canal` aqui é o canal histórico da
// agência (pra filtrar a tabela), independente de qual dimensão (canal
// ou faixa de dias) definiu a agência entrar naquele card específico.
export interface AgenciaRecenciaDetalhe {
  nome: string;
  cnpj: string;
  filial: string;
  executivo: string;
  gestor: string;
  canal: Canal;
  ultimaVenda: string; // "DD/MM/AAAA"
  dias: number;
  aereo365d: number;
  terrestre365d: number;
}

export type ChaveRecencia = "compraram30d" | "compraramAno" | "semVendas30dMais" | "semVendasAno";

export interface ConversaoCanal {
  saudePct: number;
  volumeMesVarPct: number;
  bilhetesVendasMesVarPct: number;
  agenciasMesVarPct: number;
  periodoComparativo: string;
  aereoMes: { valor: number; bilhetes: number };
  terrestreMes: { valor: number; vendas: number };
  // Total de agências da carteira consideradas no cálculo de Saúde —
  // mostrado na outra extremidade do card "Saúde" (pedido do usuário,
  // 2026-08-19).
  totalClientes: number;
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

export type ChaveCruzamento = "ambos" | "soAereo" | "soTerrestre" | "nenhum";

// Linha de detalhamento por agência dos 4 cards de cruzamento (4.11) —
// "Última" fica null quando aquele canal nunca teve venda (categoria
// "Só aéreo" nunca tem ultimaTerrestre, "Nenhum" não tem nenhuma das duas).
export interface AgenciaCruzamentoDetalhe {
  nome: string;
  cnpj: string;
  base: string;
  executivo: string;
  bilhetesAereo: number;
  aereo365d: number;
  vendasTerrestre: number;
  terrestre365d: number;
  ultimaAereo: string | null;
  ultimaTerrestre: string | null;
}

export interface DashboardVendasData {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
  // Um conjunto de mini-KPIs por período (mesma chave de
  // resumoPorPeriodo) — antes era um valor fixo (sempre "hoje"), por
  // isso os cards Clientes/Bilhetes/Ticket Médio não acompanhavam o
  // seletor Hoje/Ontem/Este mês/Este ano do card de cima (corrigido
  // 2026-08-19).
  miniKpis: Record<PeriodoResumo, MiniKpis>;
  intraday: BucketIntraday[];
  projecao: ProjecaoDia;
  acuracia: AcuraciaProjecao;
  recencia: RecenciaAgencias;
  recenciaDetalhe: Record<ChaveRecencia, AgenciaRecenciaDetalhe[]>;
  conversao: Conversao;
  vendasMensais: VendaMensal[];
  vendasDiarias: VendaDiaria[];
  rankingPorMes: Record<string, TopAgencia[]>;
  fornecedoresPorMes: Record<string, TopFornecedor[]>;
  nacionalInternacionalPorMes: Record<string, NacionalInternacional>;
  cruzamentoCanais: CruzamentoCanais;
  cruzamentoDetalhe: Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]>;
}

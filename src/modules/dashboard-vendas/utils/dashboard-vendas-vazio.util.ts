import type {
  Conversao,
  ConversaoCanal,
  CruzamentoCanais,
  CanalResumo,
  ChaveCruzamento,
  ChaveRecencia,
  AgenciaCruzamentoDetalhe,
  AgenciaRecenciaDetalhe,
  MiniKpis,
  NacionalInternacional,
  PeriodoResumo,
  ProjecaoDia,
  RecenciaAgencias,
  ResumoDia,
  TopAgencia,
  TopFornecedor,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// "0/vazio honesto" pro Dashboard de Vendas quando SST_API_KEY não está
// configurada, ou quando uma seção falha contra o SST mesmo com a chave
// presente — mesmo espírito de executivo-dashboard-vazio.util.ts. Até
// 2026-08-25 os dois casos caíam pro dashboard-vendas.mock-service.ts
// (número plausível, inventado); decisão do usuário nessa data: nunca mais
// disfarçar dado ausente com mock.
//
// `intraday`/`acuracia` (via `obterMockEstatico`) NÃO têm builder aqui de
// propósito — não são fallback de indisponibilidade, são mock permanente
// (sem endpoint/job no SST hoje, ver docs/faltante.md) e continuam vindo
// de dashboardVendasMockService mesmo com SST_API_KEY OK.

const PERIODOS: PeriodoResumo[] = ["hoje", "ontem", "mes", "ano"];

function nacionalInternacionalVazio(): NacionalInternacional {
  return { nacional: { valor: 0, bilhetes: 0 }, internacional: { valor: 0, bilhetes: 0 } };
}

function canalResumoVazio(): CanalResumo {
  return {
    valor: 0,
    quantidade: 0,
    participacaoPct: 0,
    margemPct: 0,
    nacIntDetalhe: nacionalInternacionalVazio(),
  };
}

function resumoDiaVazio(): ResumoDia {
  return {
    atualizadoEm: new Date(),
    aereo: canalResumoVazio(),
    terrestre: canalResumoVazio(),
    margemTotalPct: 0,
  };
}

export function resumoPorPeriodoVazio(): Record<PeriodoResumo, ResumoDia> {
  return Object.fromEntries(PERIODOS.map((periodo) => [periodo, resumoDiaVazio()])) as Record<
    PeriodoResumo,
    ResumoDia
  >;
}

function miniKpisVazio(): MiniKpis {
  return { clientesDistintos: 0, bilhetesAereo: 0, ticketMedioAereo: 0 };
}

export function miniKpisPorPeriodoVazio(): Record<PeriodoResumo, MiniKpis> {
  return Object.fromEntries(PERIODOS.map((periodo) => [periodo, miniKpisVazio()])) as Record<
    PeriodoResumo,
    MiniKpis
  >;
}

export function rankingPorPeriodoVazio(): Record<PeriodoResumo, TopAgencia[]> {
  return Object.fromEntries(
    PERIODOS.map((periodo): [PeriodoResumo, TopAgencia[]] => [periodo, []]),
  ) as Record<PeriodoResumo, TopAgencia[]>;
}

export function fornecedoresPorPeriodoVazio(): Record<PeriodoResumo, TopFornecedor[]> {
  return Object.fromEntries(
    PERIODOS.map((periodo): [PeriodoResumo, TopFornecedor[]] => [periodo, []]),
  ) as Record<PeriodoResumo, TopFornecedor[]>;
}

export function nacionalInternacionalPorMesVazio(): Record<string, NacionalInternacional> {
  return { mes: nacionalInternacionalVazio(), ano: nacionalInternacionalVazio() };
}

export function resumoEDiaVazio() {
  return {
    resumoPorPeriodo: resumoPorPeriodoVazio(),
    miniKpis: miniKpisPorPeriodoVazio(),
    rankingPorPeriodo: rankingPorPeriodoVazio(),
    fornecedoresPorPeriodo: fornecedoresPorPeriodoVazio(),
    nacionalInternacionalPorMes: nacionalInternacionalPorMesVazio(),
  };
}

export function projecaoVazia(): ProjecaoDia {
  return {
    atualizadoEm: new Date(),
    percentualDiaTranscorrido: 0,
    fechamentoEsperado: 0,
    faixaMin: 0,
    faixaMax: 0,
    realizado: 0,
    aEmitir: 0,
    nacional: { projecao: 0, realizado: 0 },
    internacional: { projecao: 0, realizado: 0 },
    curva: [],
  };
}

function conversaoCanalVazia(): ConversaoCanal {
  return {
    saudePct: 0,
    volumeMesVarPct: 0,
    bilhetesVendasMesVarPct: 0,
    agenciasMesVarPct: 0,
    periodoComparativo: "",
    aereoMes: { valor: 0, bilhetes: 0 },
    terrestreMes: { valor: 0, vendas: 0 },
    totalClientes: 0,
  };
}

export function conversaoVazia(): Conversao {
  return {
    ambos: conversaoCanalVazia(),
    aereo: conversaoCanalVazia(),
    terrestre: conversaoCanalVazia(),
  };
}

function grupoRecenciaVazio() {
  return { total: 0, soAereo: 0, soTerrestre: 0, ambos: 0 };
}

export function recenciaVazia(): RecenciaAgencias {
  return {
    compraram30d: grupoRecenciaVazio(),
    compraramAno: grupoRecenciaVazio(),
    semVendas30dMais: { total: 0, faixa31a89: 0, faixa90a179: 0, faixa180Mais: 0 },
    semVendasAno: {
      ...grupoRecenciaVazio(),
      compraramAnoAnterior: 0,
      compraramAnoAtual: 0,
      soAnoAnterior: 0,
    },
  };
}

const CHAVES_RECENCIA: ChaveRecencia[] = [
  "compraram30d",
  "compraramAno",
  "semVendas30dMais",
  "semVendasAno",
];

export function recenciaDetalheVazio(): Record<ChaveRecencia, AgenciaRecenciaDetalhe[]> {
  return Object.fromEntries(
    CHAVES_RECENCIA.map((chave): [ChaveRecencia, AgenciaRecenciaDetalhe[]] => [chave, []]),
  ) as Record<ChaveRecencia, AgenciaRecenciaDetalhe[]>;
}

export function cruzamentoCanaisVazio(): CruzamentoCanais {
  const grupo = { qtd: 0, pct: 0 };
  return {
    totalAgenciasCarteira: 0,
    ambos: { ...grupo },
    soAereo: { ...grupo },
    soTerrestre: { ...grupo },
    nenhum: { ...grupo },
  };
}

const CHAVES_CRUZAMENTO: ChaveCruzamento[] = ["ambos", "soAereo", "soTerrestre", "nenhum"];

export function cruzamentoDetalheVazio(): Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]> {
  return Object.fromEntries(
    CHAVES_CRUZAMENTO.map((chave): [ChaveCruzamento, AgenciaCruzamentoDetalhe[]] => [chave, []]),
  ) as Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]>;
}

export function recenciaECruzamentoVazio() {
  return {
    recencia: recenciaVazia(),
    recenciaDetalhe: recenciaDetalheVazio(),
    cruzamentoCanais: cruzamentoCanaisVazio(),
    cruzamentoDetalhe: cruzamentoDetalheVazio(),
  };
}

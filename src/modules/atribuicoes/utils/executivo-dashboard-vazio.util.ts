import type {
  CanalMargemPeriodo,
  CanalMargemResumo,
  CrossCanal,
  KpisSecundarios,
  MargemRentabExecutivo,
  PeriodoVendasMesHero,
  SegmentoComLista,
  SegmentoSaude,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// "0/vazio honesto" pro dashboard do Executivo (e, por herança, do Gestor —
// gestor-dashboard.controller.ts soma o dashboard de cada executivo
// subordinado) quando não há SICA ou o SST está fora do ar — decisão do
// usuário, 2026-08-25: nunca mais inventar um número plausível (mock) pra
// disfarçar a ausência de dado real. Usado tanto por
// executivo-dashboard.controller.ts (sem SICA, decide antes de chamar o
// SST) quanto por executivo-dashboard.sst-service.ts (SICA existe, mas a
// chamada ao SST falhou — `comFallback`).
//
// `miniStats.ociosasLimite`/`comCredito` NÃO têm builder aqui de propósito:
// não são fallback de indisponibilidade, são mock permanente (sem fonte
// real no SST hoje, mesmo com SICA+SST OK) — continuam vindo de
// executivoDashboardMockService nos dois arquivos acima.

export function heroVazio(): Record<PeriodoVendasMesHero, VendasMesHero> {
  const vazio: VendasMesHero = { valor: 0, bilhetes: 0, agenciasVendendo: 0, variacaoPct: 0 };
  return { dia: vazio, ontem: vazio, mes: vazio, ano: vazio };
}

export function kpisVazios(): KpisSecundarios {
  return {
    mesAnteriorValor: 0,
    mesAnteriorFaltaValor: 0,
    mesAnteriorPercentualAtingido: 0,
    projecaoFimMes: 0,
    acumuladoAnoValor: 0,
    acumuladoAnoBilhetes: 0,
    ticketMedio30d: 0,
  };
}

function canalMargemVazio(): CanalMargemPeriodo {
  return {
    valor: 0,
    quantidade: 0,
    margemPct: 0,
    margemLYPct: 0,
    margemVariacaoPct: 0,
    rentabValor: 0,
    rentabLYValor: 0,
    rentabLYVariacaoPct: 0,
    ticketMedio: 0,
    nacPct: 0,
    intPct: 0,
    valorLY: 0,
    nacionalValor: 0,
    internacionalValor: 0,
  };
}

export function margemRentabVazio(): MargemRentabExecutivo {
  const resumo: CanalMargemResumo = {
    total: canalMargemVazio(),
    aereo: canalMargemVazio(),
    terrestre: canalMargemVazio(),
  };
  return { dia: resumo, ontem: resumo, mes: resumo, ano: resumo };
}

function segmentoVazio(): SegmentoComLista {
  return { quantidade: 0, pct: 0, agencias: [] };
}

// `aprovadas` usa `totalAgencias` (banco local) em vez de 0 — número real
// disponível sem depender do SST, melhor que zerar um dado que a gente já
// tem (mesmo critério do fallback de `agencias` em miniStats).
export function crossCanalVazio(totalAgencias: number): CrossCanal {
  return {
    ativasUltimos12m: 0,
    aprovadas: totalAgencias,
    volAereo: 0,
    volTerrestre: 0,
    soAereo: segmentoVazio(),
    soTerrestre: segmentoVazio(),
    ambos: segmentoVazio(),
  };
}

// Mesmas 4 categorias/labels de executivo-dashboard.mock-service.ts
// (gerarSaudeCarteira) — só a contagem/lista zera; a categorização em si é
// config real do produto, não dado inventado.
export function saudeCarteiraVazia(): SegmentoSaude[] {
  return [
    {
      chave: "ativas",
      label: "Ativas c/ credito",
      descricao: "Vendeu nos últimos 30 dias",
      quantidade: 0,
      pct: 0,
      agencias: [],
    },
    {
      chave: "potenciais",
      label: "Agencias Carteira Click",
      descricao: "Vendeu nos últimos 12 meses, mas não nos últimos 30 dias",
      quantidade: 0,
      pct: 0,
      agencias: [],
    },
    {
      chave: "ociosas",
      label: "Agencias com Limite de credito parado",
      descricao: "Aprovada, sem venda nos últimos 12 meses",
      quantidade: 0,
      pct: 0,
      agencias: [],
    },
    {
      chave: "inativas",
      label: "agencias sem vendas por 60 dias",
      descricao: "Status inativo no SICA, sem venda nos últimos 12 meses",
      quantidade: 0,
      pct: 0,
      agencias: [],
    },
  ];
}

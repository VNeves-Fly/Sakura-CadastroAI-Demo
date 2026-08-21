import type {
  CanalTv,
  CompanhiaShareTv,
  PeriodoTv,
  Top10LinhaTv,
  TvData,
} from "@/modules/tv/types/tv.types";

// Dados "hoje" vêm literalmente do mockup de referência (fast-view2.html,
// print do usuário) — mês/ano são escalados a partir deles pelos mesmos
// fatores da própria referência (vendas hoje→mês→ano), pra manter a
// proporção realista sem precisar inventar 3 conjuntos inteiros de
// números à mão. Terrestre é sempre ~2,06% do total (mesma proporção do
// "hoje" de referência) — aéreo é o resto, pra bater com o total de
// "Vendas" de cada período.

const VENDAS_HOJE = 1_414_725.46;
const VENDAS_MES = 158_127_283.93;
const VENDAS_ANO = 1_413_359_489.15;

const FATOR_MES = VENDAS_MES / VENDAS_HOJE;
const FATOR_ANO = VENDAS_ANO / VENDAS_HOJE;
// "Ontem" não vem da referência (que só tinha Hoje/Mês/Ano) — mesma
// ordem de grandeza de "hoje", com uma variação de dia-a-dia razoável
// (pedido do usuário, 2026-08-20).
const FATOR_ONTEM = 0.7;

const TERRESTRE_PCT_DO_TOTAL = 29_108.7 / VENDAS_HOJE;

interface CanalBase {
  bilhetes: number;
  agencias: number;
  nacPct: number;
}

const AEREO_HOJE: CanalBase = { bilhetes: 625, agencias: 146, nacPct: 48.3 };
const TERRESTRE_HOJE: CanalBase = { bilhetes: 30, agencias: 17, nacPct: 74.8 };

function construirCanalPorPeriodo(
  base: CanalBase,
  valorTotalPorPeriodo: Record<PeriodoTv, number>,
) {
  const resultado = {} as Record<PeriodoTv, CanalTv>;
  const periodos: { chave: PeriodoTv; fator: number }[] = [
    { chave: "hoje", fator: 1 },
    { chave: "ontem", fator: FATOR_ONTEM },
    { chave: "mes", fator: FATOR_MES },
    { chave: "ano", fator: FATOR_ANO },
  ];
  for (const { chave, fator } of periodos) {
    const valorTotal = valorTotalPorPeriodo[chave];
    const bilhetes = Math.round(base.bilhetes * fator);
    resultado[chave] = {
      valorTotal,
      bilhetes,
      agencias: Math.round(base.agencias * Math.sqrt(fator)),
      ticketMedio: bilhetes > 0 ? valorTotal / bilhetes : 0,
      nacPct: base.nacPct,
      intlPct: 100 - base.nacPct,
    };
  }
  return resultado;
}

const COMPANHIAS_SHARE_HOJE: CompanhiaShareTv[] = [
  { nome: "Azul", corHex: "#00A1E0", pct: 47.5, valorAbsoluto: 0 },
  { nome: "Gol", corHex: "#FF6600", pct: 26.7, valorAbsoluto: 0 },
  { nome: "Latam", corHex: "#E91E8C", pct: 25.9, valorAbsoluto: 0 },
];

function construirShareAereoPorPeriodo(
  aereoPorPeriodo: Record<PeriodoTv, CanalTv>,
): Record<PeriodoTv, CompanhiaShareTv[]> {
  const resultado = {} as Record<PeriodoTv, CompanhiaShareTv[]>;
  for (const periodo of Object.keys(aereoPorPeriodo) as PeriodoTv[]) {
    const aereo = aereoPorPeriodo[periodo];
    const valorNacional = aereo.valorTotal * (aereo.nacPct / 100);
    resultado[periodo] = COMPANHIAS_SHARE_HOJE.map((companhia) => ({
      ...companhia,
      valorAbsoluto: valorNacional * (companhia.pct / 100),
    }));
  }
  return resultado;
}

const TOP10_CLIENTES_HOJE: Top10LinhaTv[] = [
  { posicao: 1, nome: "TJT Viagens", valor: 145_580.68, margemPct: 3.33 },
  { posicao: 2, nome: "Maxmilhas", valor: 87_638.38, margemPct: 3.08 },
  { posicao: 3, nome: "Vai de Promo BHZ", valor: 86_594.03, margemPct: 4.65 },
  { posicao: 4, nome: "Jazz Side", valor: 60_047.56, margemPct: 3.46 },
  { posicao: 5, nome: "Travel Corp", valor: 45_957.62, margemPct: 1.86 },
  { posicao: 6, nome: "Mug Agencia", valor: 44_844.3, margemPct: 2.96 },
  { posicao: 7, nome: "Orleanstur", valor: 43_767.66, margemPct: 2.65 },
  { posicao: 8, nome: "Check Tours TA", valor: 41_155.57, margemPct: 5.06 },
  { posicao: 9, nome: "Maxxima Turismo", valor: 32_859.9, margemPct: 2.06 },
  { posicao: 10, nome: "R3 Viagens", valor: 29_601.7, margemPct: 1.46 },
];

const TOP10_NACIONAL_HOJE: Top10LinhaTv[] = [
  { posicao: 1, nome: "TJT Viagens", valor: 130_942.95, margemPct: 3.34 },
  { posicao: 2, nome: "Maxmilhas", valor: 87_638.38, margemPct: 3.08 },
  { posicao: 3, nome: "Vai de Promo BHZ", valor: 86_594.03, margemPct: 4.65 },
  { posicao: 4, nome: "Grupo MM", valor: 18_385.82, margemPct: 4.15 },
  { posicao: 5, nome: "Orleanstur", valor: 17_900.32, margemPct: 2.0 },
  { posicao: 6, nome: "GWA/GPS Agencia", valor: 16_155.82, margemPct: 5.21 },
  { posicao: 7, nome: "SX Corp", valor: 8_842.67, margemPct: 2.53 },
  { posicao: 8, nome: "RCP Viagens", valor: 8_784.1, margemPct: 3.99 },
  { posicao: 9, nome: "Nexus Travel", valor: 8_766.49, margemPct: 5.22 },
  { posicao: 10, nome: "Fab Turismo", valor: 8_477.47, margemPct: 11.62 },
];

const TOP10_INTERNACIONAL_HOJE: Top10LinhaTv[] = [
  { posicao: 1, nome: "Jazz Side", valor: 60_047.56, margemPct: 3.46 },
  { posicao: 2, nome: "Mug Agencia", valor: 44_784.3, margemPct: 2.95 },
  { posicao: 3, nome: "Check Tours TA", valor: 41_155.57, margemPct: 5.06 },
  { posicao: 4, nome: "Travel Corp", valor: 38_899.27, margemPct: 0.53 },
  { posicao: 5, nome: "Maxxima Turismo", valor: 29_042.56, margemPct: 1.56 },
  { posicao: 6, nome: "CK Exec Viagens", valor: 27_023.18, margemPct: 1.77 },
  { posicao: 7, nome: "Orleanstur", valor: 25_867.34, margemPct: 3.1 },
  { posicao: 8, nome: "Luck Viagens", valor: 25_326.51, margemPct: 1.14 },
  { posicao: 9, nome: "TS Agencia de Viagens", valor: 24_357.29, margemPct: 0.0 },
  { posicao: 10, nome: "R3 Viagens", valor: 23_928.06, margemPct: 0.9 },
];

function construirTop10PorPeriodo(linhasHoje: Top10LinhaTv[]): Record<PeriodoTv, Top10LinhaTv[]> {
  return {
    hoje: linhasHoje,
    ontem: linhasHoje.map((linha) => ({ ...linha, valor: linha.valor * FATOR_ONTEM })),
    mes: linhasHoje.map((linha) => ({ ...linha, valor: linha.valor * FATOR_MES })),
    ano: linhasHoje.map((linha) => ({ ...linha, valor: linha.valor * FATOR_ANO })),
  };
}

async function obterDadosMock(): Promise<TvData> {
  const totalPorPeriodo: Record<PeriodoTv, number> = {
    hoje: VENDAS_HOJE,
    ontem: VENDAS_HOJE * FATOR_ONTEM,
    mes: VENDAS_MES,
    ano: VENDAS_ANO,
  };

  const terrestreValorPorPeriodo: Record<PeriodoTv, number> = {
    hoje: totalPorPeriodo.hoje * TERRESTRE_PCT_DO_TOTAL,
    ontem: totalPorPeriodo.ontem * TERRESTRE_PCT_DO_TOTAL,
    mes: totalPorPeriodo.mes * TERRESTRE_PCT_DO_TOTAL,
    ano: totalPorPeriodo.ano * TERRESTRE_PCT_DO_TOTAL,
  };
  const aereoValorPorPeriodo: Record<PeriodoTv, number> = {
    hoje: totalPorPeriodo.hoje - terrestreValorPorPeriodo.hoje,
    ontem: totalPorPeriodo.ontem - terrestreValorPorPeriodo.ontem,
    mes: totalPorPeriodo.mes - terrestreValorPorPeriodo.mes,
    ano: totalPorPeriodo.ano - terrestreValorPorPeriodo.ano,
  };

  const aereo = construirCanalPorPeriodo(AEREO_HOJE, aereoValorPorPeriodo);
  const terrestre = construirCanalPorPeriodo(TERRESTRE_HOJE, terrestreValorPorPeriodo);

  return {
    vendas: {
      hoje: { valorTotal: VENDAS_HOJE, margemPct: 4.0 },
      mes: { valorTotal: VENDAS_MES, margemPct: 3.87 },
      ano: { valorTotal: VENDAS_ANO, margemPct: 4.32 },
    },
    aereo,
    terrestre,
    shareAereo: construirShareAereoPorPeriodo(aereo),
    top10Clientes: construirTop10PorPeriodo(TOP10_CLIENTES_HOJE),
    top10Nacional: construirTop10PorPeriodo(TOP10_NACIONAL_HOJE),
    top10Internacional: construirTop10PorPeriodo(TOP10_INTERNACIONAL_HOJE),
  };
}

export const tvMockService = {
  obterDados: obterDadosMock,
};

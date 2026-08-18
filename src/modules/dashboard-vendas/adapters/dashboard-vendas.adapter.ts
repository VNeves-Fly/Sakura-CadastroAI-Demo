import type {
  CanalResumo,
  CruzamentoCanais,
  DashboardVendasData,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Sempre chamado antes do service ser consumido pela view-model — o
// service devolve os números-base (valor/quantidade/margem já definidos
// na fixture), e é aqui que participação % e % de carteira são
// calculados de verdade, nunca hardcoded na origem.

function calcularParticipacao(canal: CanalResumo, totalGeral: number): CanalResumo {
  return {
    ...canal,
    participacaoPct: totalGeral > 0 ? (canal.valor / totalGeral) * 100 : 0,
  };
}

function normalizarResumo(resumo: ResumoDia): ResumoDia {
  const totalGeral = resumo.aereo.valor + resumo.terrestre.valor;
  return {
    ...resumo,
    aereo: calcularParticipacao(resumo.aereo, totalGeral),
    terrestre: calcularParticipacao(resumo.terrestre, totalGeral),
  };
}

// Exportadas à parte (além de `toViewModel`) pra uso no carregamento
// progressivo (ver crm/dashboard/page.tsx) — cada seção streamada via
// Suspense normaliza só o próprio pedaço, sem esperar o resto.
export function normalizarResumoPorPeriodo(
  resumoPorPeriodo: DashboardVendasData["resumoPorPeriodo"],
): DashboardVendasData["resumoPorPeriodo"] {
  return Object.fromEntries(
    Object.entries(resumoPorPeriodo).map(([periodo, resumo]) => [
      periodo,
      normalizarResumo(resumo),
    ]),
  ) as DashboardVendasData["resumoPorPeriodo"];
}

export function normalizarCruzamento(cruzamento: CruzamentoCanais): CruzamentoCanais {
  const total = cruzamento.totalAgenciasCarteira;
  const comPct = (grupo: { qtd: number; pct: number }) => ({
    ...grupo,
    pct: total > 0 ? (grupo.qtd / total) * 100 : 0,
  });
  return {
    ...cruzamento,
    ambos: comPct(cruzamento.ambos),
    soAereo: comPct(cruzamento.soAereo),
    soTerrestre: comPct(cruzamento.soTerrestre),
    nenhum: comPct(cruzamento.nenhum),
  };
}

export const dashboardVendasAdapter = {
  toViewModel(raw: DashboardVendasData): DashboardVendasData {
    return {
      ...raw,
      resumoPorPeriodo: normalizarResumoPorPeriodo(raw.resumoPorPeriodo),
      cruzamentoCanais: normalizarCruzamento(raw.cruzamentoCanais),
    };
  },
};

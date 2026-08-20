import { create } from "zustand";
import type { PeriodoResumo } from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Filtro de período do cabeçalho do Dashboard CRM (Hoje/Ontem/Este mês/
// Este ano/Personalizado) — fonte única pra página toda: dirige o card de
// resumo, os mini-KPIs e os rankings de Top 10 Agências/Fornecedores.
// Antes cada seção tinha seu próprio período isolado (os rankings só
// entendiam Mês/Ano); unificado a pedido do usuário, 2026-08-20.
//
// Zustand porque o estado precisa ser compartilhado entre `ResumoDoDiaSecao`
// e `RankingsSecao` — dois Server Components em posições diferentes da
// árvore (ver dashboard-vendas-view.tsx), sem um client wrapper comum
// acima dos dois pra fazer prop drilling. Mesmo padrão de store já usado
// nos outros módulos (ver modules/bases/stores, por exemplo).
export type FiltroPeriodoDashboard = PeriodoResumo | "personalizado";

// "Personalizado" ainda é só de UI — sem fonte de dados pra um intervalo
// arbitrário (decisão do usuário, 2026-08-18/19). Enquanto isso, todo
// consumidor cai na prévia de "Este mês" — ver resolverPeriodo.
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoResumo = "mes";

interface FiltroPeriodoDashboardState {
  filtro: FiltroPeriodoDashboard;
  dataInicial: string;
  dataFinal: string;
  setFiltro: (filtro: FiltroPeriodoDashboard) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
}

export const useFiltroPeriodoDashboardStore = create<FiltroPeriodoDashboardState>((set) => ({
  filtro: "hoje",
  dataInicial: "",
  dataFinal: "",
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
}));

// Resolve o filtro (que pode ser "personalizado") pra uma chave real de
// `PeriodoResumo`, usada pra indexar os `Record<PeriodoResumo, ...>` que
// chegam do back — mesma regra em todo consumidor do filtro (resumo,
// mini-KPIs, rankings), pra nunca divergir sobre o que "personalizado"
// mostra enquanto não tem fonte de dados própria.
export function resolverPeriodo(filtro: FiltroPeriodoDashboard): PeriodoResumo {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO : filtro;
}

// Rótulos derivados do período resolvido — usados nos títulos dos cards
// de ranking (Top 10 Agências/Fornecedores), que antes eram fixos
// "(mês)" porque só entendiam Mês/Ano (pedido do usuário, 2026-08-20).
export const LABEL_PERIODO_TITULO: Record<PeriodoResumo, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

// Mesma ideia, mas em forma de preposição — "% = participação no volume
// {do dia|de ontem|do mês|do ano}".
export const LABEL_PERIODO_PREPOSICAO: Record<PeriodoResumo, string> = {
  hoje: "do dia",
  ontem: "de ontem",
  mes: "do mês",
  ano: "do ano",
};

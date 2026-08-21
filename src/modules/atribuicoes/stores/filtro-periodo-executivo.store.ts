import { create } from "zustand";
import type { PeriodoVendasMesHero } from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Filtro de período do card "Receita total" do Executivo (SPEC 3.5) —
// mesmo desenho/UX do filtro "📅 Período" do Dashboard CRM
// (filtro-periodo-dashboard.store.ts em dashboard-vendas), mas com store
// própria: os dois módulos são isolados (ver princípio de isolamento do
// projeto), e uma store global compartilhada faria o período mudar em uma
// página refletir na outra sem essa ser a intenção (decisão do usuário,
// 2026-08-21). "dia" no lugar de "hoje" pra bater com o
// PeriodoVendasMesHero que já existia no hero desta página.
export type FiltroPeriodoExecutivo = PeriodoVendasMesHero | "personalizado";

// "Personalizado" ainda é só de UI — sem fonte de dados pra um intervalo
// arbitrário (mesma decisão já tomada no dashboard-vendas). Todo consumidor
// cai na prévia de "Mês" enquanto isso.
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoVendasMesHero = "mes";

interface FiltroPeriodoExecutivoState {
  filtro: FiltroPeriodoExecutivo;
  dataInicial: string;
  dataFinal: string;
  setFiltro: (filtro: FiltroPeriodoExecutivo) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
}

export const useFiltroPeriodoExecutivoStore = create<FiltroPeriodoExecutivoState>((set) => ({
  filtro: "mes",
  dataInicial: "",
  dataFinal: "",
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
}));

export function resolverPeriodoExecutivo(filtro: FiltroPeriodoExecutivo): PeriodoVendasMesHero {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO : filtro;
}

export const LABEL_PERIODO_EXECUTIVO: Record<PeriodoVendasMesHero, string> = {
  dia: "Dia",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

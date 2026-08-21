import { create } from "zustand";
import type { PeriodoVendasMesHeroGestor } from "@/modules/gestores/types/gestor-detalhe.types";

// Filtro de período do card "Receita total" do Gestor (SPEC 3.5) — mesmo
// desenho/UX do filtro "📅 Período" do Dashboard CRM e da réplica já feita
// pro Executivo (filtro-periodo-executivo.store.ts), mas com store própria:
// os módulos são isolados e uma store global compartilhada faria o período
// mudar numa página refletir na outra sem essa ser a intenção (mesma
// decisão tomada em 2026-08-21 para o Executivo).
export type FiltroPeriodoGestor = PeriodoVendasMesHeroGestor | "personalizado";

export const PERIODO_PREVIA_PERSONALIZADO: PeriodoVendasMesHeroGestor = "mes";

interface FiltroPeriodoGestorState {
  filtro: FiltroPeriodoGestor;
  dataInicial: string;
  dataFinal: string;
  setFiltro: (filtro: FiltroPeriodoGestor) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
}

export const useFiltroPeriodoGestorStore = create<FiltroPeriodoGestorState>((set) => ({
  filtro: "mes",
  dataInicial: "",
  dataFinal: "",
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
}));

export function resolverPeriodoGestor(filtro: FiltroPeriodoGestor): PeriodoVendasMesHeroGestor {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO : filtro;
}

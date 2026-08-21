import { create } from "zustand";
import type { PeriodoVolumeAgencia } from "@/modules/agencias-crm/utils/canal-margem-mock.util";

// Filtro de período do card "Volume total" da aba Dashboard do detalhe de
// Agência (pedido do usuário, 2026-08-21: "mesmo filtro já usado em
// /dashboard /executivo") — mesmo desenho/UX do filtro "📅 Período" do
// Dashboard CRM e do Executivo, com store própria (módulos isolados, ver
// filtro-periodo-executivo.store.ts).
export type FiltroPeriodoAgencia = PeriodoVolumeAgencia | "personalizado";

// "Personalizado" ainda é só de UI — sem fonte de dados pra um intervalo
// arbitrário (mesma decisão já tomada em dashboard-vendas/atribuicoes).
export const PERIODO_PREVIA_PERSONALIZADO_AGENCIA: PeriodoVolumeAgencia = "mes";

interface FiltroPeriodoAgenciaState {
  filtro: FiltroPeriodoAgencia;
  dataInicial: string;
  dataFinal: string;
  setFiltro: (filtro: FiltroPeriodoAgencia) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
}

export const useFiltroPeriodoAgenciaStore = create<FiltroPeriodoAgenciaState>((set) => ({
  filtro: "ano",
  dataInicial: "",
  dataFinal: "",
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
}));

export function resolverPeriodoAgencia(filtro: FiltroPeriodoAgencia): PeriodoVolumeAgencia {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO_AGENCIA : filtro;
}

export const LABEL_PERIODO_AGENCIA: Record<PeriodoVolumeAgencia, string> = {
  dia: "Dia",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

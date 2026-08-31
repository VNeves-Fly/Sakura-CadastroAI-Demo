import { create } from "zustand";
import { obterDashboardPersonalizadoAction } from "@/modules/atribuicoes/actions/executivo-dashboard.actions";
import type { DashboardPersonalizadoSst } from "@/modules/atribuicoes/services/executivo-dashboard.sst-service";
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

// Fallback enquanto o intervalo real ainda não chegou (primeiro instante
// depois de aplicar, erro, ou executivo sem código SICA/SST desligado) —
// mesmo critério de PERIODO_PREVIA_PERSONALIZADO_AGENCIA em
// filtro-periodo-agencia.store.ts.
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoVendasMesHero = "mes";

interface EstadoPersonalizadoExecutivo {
  dados: DashboardPersonalizadoSst | null;
  carregando: boolean;
  erro: string | null;
}

interface FiltroPeriodoExecutivoState {
  filtro: FiltroPeriodoExecutivo;
  dataInicial: string;
  dataFinal: string;
  personalizado: EstadoPersonalizadoExecutivo;
  setFiltro: (filtro: FiltroPeriodoExecutivo) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
  // `codigoExecutivo` é o código SICA deste executivo (null = executivo
  // sem SICA vinculado, ver ExecutivoPerfil.sica) — chamada pelo popover
  // ao clicar "Aplicar período".
  carregarPersonalizado: (
    codigoExecutivo: number | null,
    inicioIso: string,
    fimIso: string,
  ) => Promise<void>;
}

export const useFiltroPeriodoExecutivoStore = create<FiltroPeriodoExecutivoState>((set) => ({
  filtro: "mes",
  dataInicial: "",
  dataFinal: "",
  personalizado: { dados: null, carregando: false, erro: null },
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
  carregarPersonalizado: async (codigoExecutivo, inicioIso, fimIso) => {
    if (!codigoExecutivo) {
      set({
        personalizado: {
          dados: null,
          carregando: false,
          erro: "Este executivo não tem código SICA vinculado.",
        },
      });
      return;
    }

    set({ personalizado: { dados: null, carregando: true, erro: null } });
    try {
      const dados = await obterDashboardPersonalizadoAction(codigoExecutivo, inicioIso, fimIso);
      set({
        personalizado: {
          dados,
          carregando: false,
          erro: dados ? null : "SST não configurado neste ambiente.",
        },
      });
    } catch (erro) {
      set({
        personalizado: {
          dados: null,
          carregando: false,
          erro: erro instanceof Error ? erro.message : "Falha ao carregar o período personalizado.",
        },
      });
    }
  },
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

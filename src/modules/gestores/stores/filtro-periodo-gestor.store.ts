import { create } from "zustand";
import { obterDashboardPersonalizadoGestorAction } from "@/modules/gestores/actions/gestor-dashboard.actions";
import type { DashboardPersonalizadoGestor } from "@/modules/gestores/actions/gestor-dashboard.actions";
import type { PeriodoVendasMesHeroGestor } from "@/modules/gestores/types/gestor-detalhe.types";

// Filtro de período do card "Receita total" do Gestor (SPEC 3.5) — mesmo
// desenho/UX do filtro "📅 Período" do Dashboard CRM e da réplica já feita
// pro Executivo (filtro-periodo-executivo.store.ts), mas com store própria:
// os módulos são isolados e uma store global compartilhada faria o período
// mudar numa página refletir na outra sem essa ser a intenção (mesma
// decisão tomada em 2026-08-21 para o Executivo).
export type FiltroPeriodoGestor = PeriodoVendasMesHeroGestor | "personalizado";

// Fallback enquanto o intervalo real ainda não chegou (primeiro instante
// depois de aplicar, erro, ou nenhum executivo subordinado com SICA) —
// mesmo critério de PERIODO_PREVIA_PERSONALIZADO em
// filtro-periodo-executivo.store.ts.
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoVendasMesHeroGestor = "mes";

interface EstadoPersonalizadoGestor {
  dados: DashboardPersonalizadoGestor | null;
  carregando: boolean;
  erro: string | null;
}

interface FiltroPeriodoGestorState {
  filtro: FiltroPeriodoGestor;
  dataInicial: string;
  dataFinal: string;
  personalizado: EstadoPersonalizadoGestor;
  setFiltro: (filtro: FiltroPeriodoGestor) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
  // O Gestor não tem SICA próprio (soma dos executivos subordinados, ver
  // docs/plano-gestores-backend.md §1) — por isso recebe a lista inteira de
  // `{id, sica}`, não um único código, chamada pelo popover ao clicar
  // "Aplicar período".
  carregarPersonalizado: (
    executivos: { id: string; sica: number | null }[],
    inicioIso: string,
    fimIso: string,
  ) => Promise<void>;
}

export const useFiltroPeriodoGestorStore = create<FiltroPeriodoGestorState>((set) => ({
  filtro: "mes",
  dataInicial: "",
  dataFinal: "",
  personalizado: { dados: null, carregando: false, erro: null },
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
  carregarPersonalizado: async (executivos, inicioIso, fimIso) => {
    if (executivos.length === 0) {
      set({
        personalizado: {
          dados: null,
          carregando: false,
          erro: "Este gestor não tem executivos subordinados.",
        },
      });
      return;
    }

    set({ personalizado: { dados: null, carregando: true, erro: null } });
    try {
      const dados = await obterDashboardPersonalizadoGestorAction(executivos, inicioIso, fimIso);
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

export function resolverPeriodoGestor(filtro: FiltroPeriodoGestor): PeriodoVendasMesHeroGestor {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO : filtro;
}

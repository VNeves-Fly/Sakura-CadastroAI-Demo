import { create } from "zustand";
import { obterResumoPersonalizadoAction } from "@/modules/dashboard-vendas/actions/dashboard-vendas.actions";
import type {
  PeriodoResumo,
  ResumoPersonalizado,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

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

// Fallback enquanto o intervalo real ainda não chegou (`personalizado.
// dados === null` — primeiro instante antes de aplicar um período, ou
// erro de validação de data) — todo consumidor usa a prévia de
// "Este mês" nesses casos, ver resolverPeriodo. Antes (2026-08-18/19) era
// o único comportamento possível porque não existia fonte de dados pra
// um intervalo arbitrário; agora existe (`/api/consolidado/
// overview-intervalo`, ver dashboard-vendas.sst-service.ts), então isto
// vira só um fallback de estado transitório/erro, não mais definitivo.
// Projeto de demonstração — a action nunca devolve `null` (sempre mock
// rico); só `dados: null` porque ainda não houve fetch, ou erro (exceção).
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoResumo = "mes";

// Resultado (real, via SST) do último intervalo aplicado no calendário —
// separado do resto do estado porque é assíncrono e tem vida própria
// (carregando/erro), diferente de resumoPorPeriodo/rankingPorPeriodo
// (pré-computados no carregamento da página, chegam prontos via props).
interface EstadoPersonalizado {
  dados: ResumoPersonalizado | null;
  carregando: boolean;
  erro: string | null;
}

interface FiltroPeriodoDashboardState {
  filtro: FiltroPeriodoDashboard;
  dataInicial: string;
  dataFinal: string;
  personalizado: EstadoPersonalizado;
  setFiltro: (filtro: FiltroPeriodoDashboard) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
  // Chamada pelo popover ao clicar "Aplicar período" — dispara a Server
  // Action (dashboard-vendas.actions.ts), que devolve dado mock rico
  // (projeto de demonstração, ver dashboard-vendas.controller.ts).
  carregarPersonalizado: (inicioIso: string, fimIso: string) => Promise<void>;
}

export const useFiltroPeriodoDashboardStore = create<FiltroPeriodoDashboardState>((set) => ({
  filtro: "hoje",
  dataInicial: "",
  dataFinal: "",
  personalizado: { dados: null, carregando: false, erro: null },
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
  carregarPersonalizado: async (inicioIso, fimIso) => {
    set({ personalizado: { dados: null, carregando: true, erro: null } });
    try {
      const dados = await obterResumoPersonalizadoAction(inicioIso, fimIso);
      set({
        personalizado: { dados, carregando: false, erro: null },
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

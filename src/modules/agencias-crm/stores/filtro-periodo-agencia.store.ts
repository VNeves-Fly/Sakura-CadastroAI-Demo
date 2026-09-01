import { create } from "zustand";
import { obterVolumePersonalizadoAction } from "@/modules/agencias-crm/actions/agencia-detalhe.actions";
import type { VolumeCanalPeriodoAgencia } from "@/modules/agencias-crm/types/agencia-detalhe.types";
import type { PeriodoVolumeAgencia } from "@/modules/agencias-crm/utils/canal-margem-mock.util";

// Filtro de período do card "Volume total" da aba Dashboard do detalhe de
// Agência (pedido do usuário, 2026-08-21: "mesmo filtro já usado em
// /dashboard /executivo") — mesmo desenho/UX do filtro "📅 Período" do
// Dashboard CRM e do Executivo, com store própria (módulos isolados, ver
// filtro-periodo-executivo.store.ts).
export type FiltroPeriodoAgencia = PeriodoVolumeAgencia | "personalizado";

// Fallback enquanto o intervalo real ainda não chegou (primeiro instante
// depois de aplicar, erro, ou agência sem código SICA/SST desligado) —
// mesmo critério de PERIODO_PREVIA_PERSONALIZADO em
// filtro-periodo-dashboard.store.ts.
export const PERIODO_PREVIA_PERSONALIZADO_AGENCIA: PeriodoVolumeAgencia = "mes";

interface EstadoPersonalizadoAgencia {
  dados: VolumeCanalPeriodoAgencia | null;
  carregando: boolean;
  erro: string | null;
}

interface FiltroPeriodoAgenciaState {
  filtro: FiltroPeriodoAgencia;
  dataInicial: string;
  dataFinal: string;
  personalizado: EstadoPersonalizadoAgencia;
  setFiltro: (filtro: FiltroPeriodoAgencia) => void;
  setDataInicial: (valor: string) => void;
  setDataFinal: (valor: string) => void;
  // `codigoEmpresa` é o código SICA desta agência (null = agência sem
  // integração real, ver AgenciaDetalhePerfilComercial.sica) — chamada
  // pelo popover ao clicar "Aplicar período".
  carregarPersonalizado: (
    codigoEmpresa: string | null,
    inicioIso: string,
    fimIso: string,
  ) => Promise<void>;
}

export const useFiltroPeriodoAgenciaStore = create<FiltroPeriodoAgenciaState>((set) => ({
  filtro: "ano",
  dataInicial: "",
  dataFinal: "",
  personalizado: { dados: null, carregando: false, erro: null },
  setFiltro: (filtro) => set({ filtro }),
  setDataInicial: (dataInicial) => set({ dataInicial }),
  setDataFinal: (dataFinal) => set({ dataFinal }),
  carregarPersonalizado: async (codigoEmpresa, inicioIso, fimIso) => {
    if (!codigoEmpresa) {
      set({
        personalizado: {
          dados: null,
          carregando: false,
          erro: "Esta agência não tem integração real com o SST.",
        },
      });
      return;
    }

    set({ personalizado: { dados: null, carregando: true, erro: null } });
    try {
      const dados = await obterVolumePersonalizadoAction(codigoEmpresa, inicioIso, fimIso);
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

export function resolverPeriodoAgencia(filtro: FiltroPeriodoAgencia): PeriodoVolumeAgencia {
  return filtro === "personalizado" ? PERIODO_PREVIA_PERSONALIZADO_AGENCIA : filtro;
}

export const LABEL_PERIODO_AGENCIA: Record<PeriodoVolumeAgencia, string> = {
  dia: "Dia",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

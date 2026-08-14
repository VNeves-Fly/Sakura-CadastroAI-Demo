import { create } from "zustand";
import { persist } from "zustand/middleware";

// Toggle global de "mostrar/ocultar valores sensíveis" (financeiro, metas,
// limites etc). Persistido em localStorage pra não voltar a ocultar a cada
// navegação — nasce sempre mascarado (dadosVisiveis: false) na primeira
// visita, como pedido na spec de Executivos. Zustand + persist, mesmo padrão
// do autosave do wizard (ver cadastro-wizard.store.ts).
interface DataVisibilityState {
  dadosVisiveis: boolean;
  alternarVisibilidade: () => void;
}

export const useDataVisibilityStore = create<DataVisibilityState>()(
  persist(
    (set) => ({
      dadosVisiveis: false,
      alternarVisibilidade: () => set((state) => ({ dadosVisiveis: !state.dadosVisiveis })),
    }),
    { name: "sakura-dados-sensiveis-visiveis" },
  ),
);

// Hook público — mantém a chamada `useDataVisibility()` sugerida na spec,
// por cima do store Zustand (padrão de estado global já usado no projeto).
export function useDataVisibility() {
  const dadosVisiveis = useDataVisibilityStore((state) => state.dadosVisiveis);
  const alternarVisibilidade = useDataVisibilityStore((state) => state.alternarVisibilidade);
  return { dadosVisiveis, alternarVisibilidade };
}

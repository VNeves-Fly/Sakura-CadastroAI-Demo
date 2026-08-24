import { useEffect, useState } from "react";
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

  // Evita erro de hydration em todo consumidor (SensitiveValue,
  // ToggleVisibilidadeButton, etc): o middleware `persist` do Zustand
  // reidrata o `localStorage` de forma síncrona no client, antes do
  // primeiro paint — numa visita em que o usuário já tinha ligado a
  // visibilidade, `dadosVisiveis` nasce `true` no client enquanto o
  // servidor (sem acesso a localStorage) sempre renderizou `false`. Força
  // `false` até o primeiro efeito rodar, garantindo que o primeiro render
  // do client bata com o do servidor; o valor real aparece um instante
  // depois, já com React montado (sem novo mismatch).
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return { dadosVisiveis: hasMounted && dadosVisiveis, alternarVisibilidade };
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Factory pra store de override de status ativo/inativo, 100% front-end —
// mesma decisão já tomada pra "Nível" de Gestor (ver gestor-nivel.types.ts):
// os models Gestor/Promotor não têm campo de status hoje, e migration está
// fora do escopo atual. Extraído como factory (DRY) pra Gestor e Executivo
// reaproveitarem a mesma lógica de persist em localStorage, cada um com sua
// própria chave/store.
interface AtivoOverridesState {
  overrides: Record<string, boolean>;
  definirAtivo: (id: string, ativo: boolean) => void;
}

export function criarAtivoOverridesStore(persistName: string) {
  return create<AtivoOverridesState>()(
    persist(
      (set) => ({
        overrides: {},
        definirAtivo: (id, ativo) =>
          set((state) => ({ overrides: { ...state.overrides, [id]: ativo } })),
      }),
      { name: persistName },
    ),
  );
}

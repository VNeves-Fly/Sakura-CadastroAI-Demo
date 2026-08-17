import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GestorNivel } from "@/modules/gestores/types/gestor-nivel.types";

// Overrides de Nível definidos no cadastro/edição, só no navegador (ver
// aviso completo em gestor-nivel.types.ts) — mesmo padrão de
// agenda-visitas.store.ts (persist em localStorage, chave por id).
interface GestorNiveisState {
  overrides: Record<string, GestorNivel>;
  definirNivel: (gestorId: string, nivel: GestorNivel) => void;
}

export const useGestorNiveisStore = create<GestorNiveisState>()(
  persist(
    (set) => ({
      overrides: {},
      definirNivel: (gestorId, nivel) =>
        set((state) => ({ overrides: { ...state.overrides, [gestorId]: nivel } })),
    }),
    { name: "sakura-gestor-niveis" },
  ),
);

export function useNivelDoGestor(gestorId: string): GestorNivel | null {
  return useGestorNiveisStore((state) => state.overrides[gestorId] ?? null);
}

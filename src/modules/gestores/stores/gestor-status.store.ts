import { criarAtivoOverridesStore } from "@/modules/shared/stores/create-ativo-overrides.store";

// Status ativo/inativo do Gestor — mock 100% front-end (mesmo aviso de
// gestor-nivel.types.ts: o model Gestor do Prisma não tem esse campo hoje).
// Default é sempre "ativo" pra quem nunca foi inativado por aqui.
export const useGestorStatusStore = criarAtivoOverridesStore("sakura-gestor-status");

export function useAtivoDoGestor(gestorId: string): boolean {
  return useGestorStatusStore((state) => state.overrides[gestorId] ?? true);
}

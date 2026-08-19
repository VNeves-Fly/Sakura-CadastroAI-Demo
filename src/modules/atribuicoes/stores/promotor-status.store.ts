import { criarAtivoOverridesStore } from "@/modules/shared/stores/create-ativo-overrides.store";

// Status ativo/inativo do Executivo (Promotor) — mesmo mock front-end usado
// pra Gestor (ver gestor-status.store.ts): o model Promotor não tem esse
// campo hoje. Default é sempre "ativo" pra quem nunca foi inativado por aqui.
export const usePromotorStatusStore = criarAtivoOverridesStore("sakura-promotor-status");

export function useAtivoDoPromotor(promotorId: string): boolean {
  return usePromotorStatusStore((state) => state.overrides[promotorId] ?? true);
}

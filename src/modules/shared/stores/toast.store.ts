import { create } from "zustand";

export type TipoToast = "info" | "sucesso" | "erro";
export type CantoToast = "superior-direito" | "inferior-esquerdo";

export interface Toast {
  id: string;
  mensagem: string;
  tipo: TipoToast;
  canto: CantoToast;
}

interface ToastState {
  toasts: Toast[];
  mostrarToast: (mensagem: string, tipo?: TipoToast, canto?: CantoToast) => void;
  removerToast: (id: string) => void;
}

const DURACAO_MS = 5_000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  mostrarToast: (mensagem, tipo = "info", canto = "superior-direito") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { id, mensagem, tipo, canto }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, DURACAO_MS);
  },
  removerToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

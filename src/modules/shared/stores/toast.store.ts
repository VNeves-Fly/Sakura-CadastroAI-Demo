import { create } from "zustand";

export type TipoToast = "info" | "sucesso" | "erro";

export interface AcaoToast {
  label: string;
  href: string;
}

export interface Toast {
  id: string;
  mensagem: string;
  tipo: TipoToast;
  // Cabeçalho opcional (ex.: "🌸 Novo cadastro") mostrado acima da
  // mensagem, com a ação alinhada na mesma linha.
  titulo?: string;
  acao?: AcaoToast;
}

interface OpcoesToast {
  titulo?: string;
  acao?: AcaoToast;
}

interface ToastState {
  toasts: Toast[];
  mostrarToast: (mensagem: string, tipo?: TipoToast, opcoes?: OpcoesToast) => void;
  removerToast: (id: string) => void;
}

const DURACAO_MS = 5_000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  mostrarToast: (mensagem, tipo = "info", opcoes) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({
      toasts: [...state.toasts, { id, mensagem, tipo, titulo: opcoes?.titulo, acao: opcoes?.acao }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, DURACAO_MS);
  },
  removerToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

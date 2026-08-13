import { create } from "zustand";

interface AtendimentoNaoLidasState {
  // Total global de mensagens do cliente não lidas, em qualquer conversa —
  // alimentado por AtendimentoNaoLidasLive (hidratação + SSE + poll de
  // segurança) e por useAtendimento ao marcar uma conversa como lida.
  total: number;
  definirTotal: (total: number) => void;
}

export const useAtendimentoNaoLidasStore = create<AtendimentoNaoLidasState>((set) => ({
  total: 0,
  definirTotal: (total) => set({ total }),
}));

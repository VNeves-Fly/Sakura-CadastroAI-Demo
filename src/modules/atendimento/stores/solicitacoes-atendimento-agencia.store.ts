import { create } from "zustand";
import type { SolicitacaoAtendimentoAgencia } from "@/modules/atendimento/types/atendimento-agencia.types";

interface SolicitacoesAtendimentoAgenciaState {
  // Só pendentes envolvendo o usuário logado (solicitante/atendente atual/
  // novo atendente) — alimentado por SolicitacoesAtendimentoAgenciaLive
  // (hidratação + SSE + poll de segurança), único lugar que abre a conexão.
  pendentes: SolicitacaoAtendimentoAgencia[];
  definirPendentes: (lista: SolicitacaoAtendimentoAgencia[]) => void;
  upsertPendente: (solicitacao: SolicitacaoAtendimentoAgencia) => void;
  removerResolvida: (id: string) => void;
  pendenteDaAgencia: (agenciaId: string) => SolicitacaoAtendimentoAgencia | undefined;
}

export const useSolicitacoesAtendimentoAgenciaStore = create<SolicitacoesAtendimentoAgenciaState>(
  (set, get) => ({
    pendentes: [],
    definirPendentes: (lista) => set({ pendentes: lista }),
    upsertPendente: (solicitacao) =>
      set((state) => ({
        pendentes: [...state.pendentes.filter((item) => item.id !== solicitacao.id), solicitacao],
      })),
    removerResolvida: (id) =>
      set((state) => ({ pendentes: state.pendentes.filter((item) => item.id !== id) })),
    pendenteDaAgencia: (agenciaId) => get().pendentes.find((item) => item.agenciaId === agenciaId),
  }),
);

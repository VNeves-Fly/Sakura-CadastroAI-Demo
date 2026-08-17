import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgendaStatus } from "@/modules/atribuicoes/types/executivo-agenda.types";

// Overrides de status de visita, só no navegador (ver aviso completo em
// executivo-agenda.types.ts) — chave composta `${executivoId}:${agenciaId}`
// pra não misturar a agenda de um executivo com outro no mesmo storage.
interface VisitaOverride {
  status: AgendaStatus;
  dataAgendada: string | null;
  horaAgendada: string | null;
  observacao: string | null;
  concluidaEm: string | null;
}

interface AgendaVisitasState {
  overrides: Record<string, VisitaOverride>;
  agendar: (params: {
    executivoId: string;
    agenciaId: string;
    data: string;
    hora: string;
    observacao: string;
  }) => void;
  marcarVisitadaDireto: (executivoId: string, agenciaId: string, hoje: string) => void;
  concluir: (executivoId: string, agenciaId: string, hoje: string) => void;
}

export function chaveVisita(executivoId: string, agenciaId: string): string {
  return `${executivoId}:${agenciaId}`;
}

export const useAgendaVisitasStore = create<AgendaVisitasState>()(
  persist(
    (set) => ({
      overrides: {},

      agendar: ({ executivoId, agenciaId, data, hora, observacao }) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [chaveVisita(executivoId, agenciaId)]: {
              status: "agendada",
              dataAgendada: data,
              horaAgendada: hora || null,
              observacao: observacao || null,
              concluidaEm: null,
            },
          },
        })),

      marcarVisitadaDireto: (executivoId, agenciaId, hoje) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [chaveVisita(executivoId, agenciaId)]: {
              status: "visitada",
              dataAgendada: null,
              horaAgendada: null,
              observacao: null,
              concluidaEm: hoje,
            },
          },
        })),

      concluir: (executivoId, agenciaId, hoje) =>
        set((state) => {
          const atual = state.overrides[chaveVisita(executivoId, agenciaId)];
          return {
            overrides: {
              ...state.overrides,
              [chaveVisita(executivoId, agenciaId)]: {
                status: "visitada",
                dataAgendada: atual?.dataAgendada ?? null,
                horaAgendada: atual?.horaAgendada ?? null,
                observacao: atual?.observacao ?? null,
                concluidaEm: hoje,
              },
            },
          };
        }),
    }),
    { name: "sakura-agenda-visitas" },
  ),
);

export function useVisitaOverride(executivoId: string, agenciaId: string): VisitaOverride | null {
  return useAgendaVisitasStore(
    (state) => state.overrides[chaveVisita(executivoId, agenciaId)] ?? null,
  );
}

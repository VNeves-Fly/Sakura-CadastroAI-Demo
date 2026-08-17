"use client";

import { useMemo, useState } from "react";
import {
  useAgendaVisitasStore,
  chaveVisita,
} from "@/modules/atribuicoes/stores/agenda-visitas.store";
import { montarAgendaSeed } from "@/modules/atribuicoes/adapters/executivo-agenda.adapter";
import type { ExecutivoAgenciaResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";

export type AgendaVisao = "kanban" | "calendario" | "lista";

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useExecutivoAgendaViewModel(
  executivoId: string,
  agenciasReais: ExecutivoAgenciaResumo[],
) {
  const overrides = useAgendaVisitasStore((state) => state.overrides);
  const agendarAction = useAgendaVisitasStore((state) => state.agendar);
  const marcarVisitadaAction = useAgendaVisitasStore((state) => state.marcarVisitadaDireto);
  const concluirAction = useAgendaVisitasStore((state) => state.concluir);

  const [visao, setVisao] = useState<AgendaVisao>("kanban");
  const [busca, setBusca] = useState("");

  const agencias = useMemo(() => {
    const seed = montarAgendaSeed(agenciasReais);
    return seed.map((item) => {
      const override = overrides[chaveVisita(executivoId, item.id)];
      return override ? { ...item, ...override } : item;
    });
  }, [agenciasReais, overrides, executivoId]);

  const agenciasFiltradas = useMemo(() => {
    const normalizada = busca.trim().toLowerCase();
    if (!normalizada) return agencias;
    return agencias.filter((agencia) => agencia.nome.toLowerCase().includes(normalizada));
  }, [agencias, busca]);

  const semVisita = agenciasFiltradas.filter((agencia) => agencia.status === "sem_visita");
  const agendadas = agenciasFiltradas.filter((agencia) => agencia.status === "agendada");
  const visitadas = agenciasFiltradas.filter((agencia) => agencia.status === "visitada");

  function agendarVisita(agenciaId: string, data: string, hora: string, observacao: string) {
    agendarAction({ executivoId, agenciaId, data, hora, observacao });
  }

  function marcarVisitada(agenciaId: string) {
    marcarVisitadaAction(executivoId, agenciaId, hojeIso());
  }

  function concluirVisita(agenciaId: string) {
    concluirAction(executivoId, agenciaId, hojeIso());
  }

  return {
    visao,
    setVisao,
    busca,
    setBusca,
    agencias: agenciasFiltradas,
    // Lista completa (sem o filtro de busca) — usada no seletor de
    // agência do diálogo de agendamento, pra não depender do que está
    // digitado na busca da tela.
    todasAgencias: agencias,
    semVisita,
    agendadas,
    visitadas,
    agendarVisita,
    marcarVisitada,
    concluirVisita,
  };
}

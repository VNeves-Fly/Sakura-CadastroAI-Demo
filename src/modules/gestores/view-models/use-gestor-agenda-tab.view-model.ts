"use client";

import { useMemo, useState } from "react";
import {
  useAgendaVisitasStore,
  chaveVisita,
} from "@/modules/atribuicoes/stores/agenda-visitas.store";
import { montarAgendaSeed } from "@/modules/atribuicoes/adapters/executivo-agenda.adapter";
import { mapAgencia } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import {
  corDoExecutivo,
  type CorExecutivo,
} from "@/modules/gestores/constants/gestor-agenda.constants";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";

export interface AgendaDoExecutivo {
  executivoId: string;
  executivoNome: string;
  cor: CorExecutivo;
  agencias: AgendaAgenciaView[];
}

export interface EventoAgendaGestao {
  executivoId: string;
  executivoNome: string;
  cor: CorExecutivo;
  agencia: AgendaAgenciaView;
}

// Consolidação da agenda de TODOS os executivos do gestor — reaproveita
// direto o store/adapter já construídos pra agenda do executivo individual
// (useAgendaVisitasStore/chaveVisita/montarAgendaSeed, em
// src/modules/atribuicoes/). Isso é uma excessão deliberada ao princípio
// de "módulos não compartilham componente/utilitário entre si" (ver
// promotor-lista.adapter.ts etc.): aqui é literalmente o MESMO estado de
// visita que a página do próprio executivo lê/escreve — duplicar a lógica
// faria as duas telas mostrarem dados diferentes pro mesmo executivo, o
// que seria um bug real, não só uma inconsistência visual.
export function useGestorAgendaTabViewModel(executivos: ExecutivoComCarteira[]) {
  const overrides = useAgendaVisitasStore((state) => state.overrides);
  const [executivoSelecionadoId, setExecutivoSelecionadoId] = useState<string>("todos");

  const opcoesExecutivo = useMemo(
    () => executivos.map((executivo) => ({ id: executivo.id, nome: executivo.nome })),
    [executivos],
  );

  const agendaPorExecutivo = useMemo<AgendaDoExecutivo[]>(() => {
    return executivos.map((executivo, indice) => {
      const seed = montarAgendaSeed(executivo.agencias.map(mapAgencia));
      const agencias = seed.map((item) => {
        const override = overrides[chaveVisita(executivo.id, item.id)];
        return override ? { ...item, ...override } : item;
      });
      return {
        executivoId: executivo.id,
        executivoNome: executivo.nome,
        cor: corDoExecutivo(indice),
        agencias,
      };
    });
  }, [executivos, overrides]);

  const kpis = useMemo(() => {
    let agendadasGestao = 0;
    let visitadasGestao = 0;
    let executivosComAgenda = 0;

    for (const exec of agendaPorExecutivo) {
      let temAlgumaVisita = false;
      for (const agencia of exec.agencias) {
        if (agencia.status === "agendada") agendadasGestao += 1;
        if (agencia.status === "visitada") visitadasGestao += 1;
        if (agencia.status !== "sem_visita") temAlgumaVisita = true;
      }
      if (temAlgumaVisita) executivosComAgenda += 1;
    }

    return {
      agendadasGestao,
      visitadasGestao,
      executivosComAgenda,
      totalExecutivos: executivos.length,
    };
  }, [agendaPorExecutivo, executivos.length]);

  const eventosAgendados = useMemo<EventoAgendaGestao[]>(
    () =>
      agendaPorExecutivo.flatMap((exec) =>
        exec.agencias
          .filter((agencia) => agencia.status === "agendada" && agencia.dataAgendada)
          .map((agencia) => ({
            executivoId: exec.executivoId,
            executivoNome: exec.executivoNome,
            cor: exec.cor,
            agencia,
          })),
      ),
    [agendaPorExecutivo],
  );

  const executivoSelecionado =
    executivoSelecionadoId === "todos"
      ? null
      : (executivos.find((executivo) => executivo.id === executivoSelecionadoId) ?? null);

  return {
    opcoesExecutivo,
    executivoSelecionadoId,
    setExecutivoSelecionadoId,
    executivoSelecionado,
    agendaPorExecutivo,
    eventosAgendados,
    kpis,
  };
}

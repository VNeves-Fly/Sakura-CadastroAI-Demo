"use client";

import { useState } from "react";
import { AgendaHeader } from "@/modules/atribuicoes/components/executivo/agenda/agenda-header";
import { AgendaKanban } from "@/modules/atribuicoes/components/executivo/agenda/agenda-kanban";
import { AgendaCalendario } from "@/modules/atribuicoes/components/executivo/agenda/agenda-calendario";
import { AgendaLista } from "@/modules/atribuicoes/components/executivo/agenda/agenda-lista";
import { AgendarVisitaDialog } from "@/modules/atribuicoes/components/executivo/agenda/agendar-visita-dialog";
import { useExecutivoAgendaViewModel } from "@/modules/atribuicoes/view-models/use-executivo-agenda.view-model";
import { mapAgencia } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import type { AgenciaResumoPromotor } from "@/modules/cadastro/domain/repositories/agencia-repository";

interface GestorAgendaIndividualProps {
  executivoId: string;
  agencias: AgenciaResumoPromotor[];
}

// Agenda de UM executivo específico, vista de dentro do detalhe do gestor —
// reaproveita 100% o sistema já construído pra agenda do executivo (mesmo
// store, mesmo adapter, mesmos componentes de Kanban/Calendário/Lista/
// Dialog) em vez de duplicar ~800 linhas. Ver nota de arquitetura em
// use-gestor-agenda-tab.view-model.ts.
export function GestorAgendaIndividual({ executivoId, agencias }: GestorAgendaIndividualProps) {
  const agenciasMapeadas = agencias.map(mapAgencia);
  const {
    visao,
    setVisao,
    busca,
    setBusca,
    agencias: agenciasFiltradas,
    todasAgencias,
    semVisita,
    agendadas,
    visitadas,
    agendarVisita,
    marcarVisitada,
    concluirVisita,
  } = useExecutivoAgendaViewModel(executivoId, agenciasMapeadas);

  const [dialogAberto, setDialogAberto] = useState(false);
  const [dataParaAgendar, setDataParaAgendar] = useState<string | undefined>(undefined);

  function abrirDialogAgendar(data?: string) {
    setDataParaAgendar(data);
    setDialogAberto(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <AgendaHeader
        visao={visao}
        onVisaoChange={setVisao}
        busca={busca}
        onBuscaChange={setBusca}
        onAgendarClick={() => abrirDialogAgendar(undefined)}
      />

      {visao === "kanban" ? (
        <AgendaKanban
          semVisita={semVisita}
          agendadas={agendadas}
          visitadas={visitadas}
          onAgendar={agendarVisita}
          onMarcarVisitada={marcarVisitada}
          onConcluir={concluirVisita}
        />
      ) : visao === "calendario" ? (
        <AgendaCalendario agencias={agenciasFiltradas} onAbrirAgendar={abrirDialogAgendar} />
      ) : (
        <AgendaLista agencias={agenciasFiltradas} />
      )}

      <AgendarVisitaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        agencias={todasAgencias}
        dataInicial={dataParaAgendar}
        onConfirmar={agendarVisita}
      />
    </div>
  );
}

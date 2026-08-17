"use client";

import { useState } from "react";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import { AgendaHeader } from "@/modules/atribuicoes/components/executivo/agenda/agenda-header";
import { AgendaKanban } from "@/modules/atribuicoes/components/executivo/agenda/agenda-kanban";
import { AgendaCalendario } from "@/modules/atribuicoes/components/executivo/agenda/agenda-calendario";
import { AgendaLista } from "@/modules/atribuicoes/components/executivo/agenda/agenda-lista";
import { AgendarVisitaDialog } from "@/modules/atribuicoes/components/executivo/agenda/agendar-visita-dialog";
import { useExecutivoAgendaViewModel } from "@/modules/atribuicoes/view-models/use-executivo-agenda.view-model";
import type {
  ExecutivoPerfil,
  ExecutivoAgenciaResumo,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoAgendaViewProps {
  perfil: ExecutivoPerfil;
  agenciasReais: ExecutivoAgenciaResumo[];
}

export function ExecutivoAgendaView({ perfil, agenciasReais }: ExecutivoAgendaViewProps) {
  const {
    visao,
    setVisao,
    busca,
    setBusca,
    agencias,
    todasAgencias,
    semVisita,
    agendadas,
    visitadas,
    agendarVisita,
    marcarVisitada,
    concluirVisita,
  } = useExecutivoAgendaViewModel(perfil.id, agenciasReais);

  // Diálogo de agendamento genérico (com seletor de agência) vive aqui,
  // um nível acima das 3 visões — assim o botão "Agendar visita" do
  // AgendaHeader funciona igual em Calendário, Kanban e Lista, sem
  // duplicar estado/diálogo em cada uma.
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dataParaAgendar, setDataParaAgendar] = useState<string | undefined>(undefined);

  function abrirDialogAgendar(data?: string) {
    setDataParaAgendar(data);
    setDialogAberto(true);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <h1 className="text-foreground text-xl font-semibold">Detalhes do Executivo</h1>
      <ExecutivoProfileHeader perfil={perfil} />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva="agenda" />

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
        <AgendaCalendario agencias={agencias} onAbrirAgendar={abrirDialogAgendar} />
      ) : (
        <AgendaLista agencias={agencias} />
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

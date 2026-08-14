"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectField } from "@/components/ui/select-field";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";

interface AgendarVisitaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencias: AgendaAgenciaView[];
  dataInicial?: string;
  onConfirmar: (agenciaId: string, data: string, hora: string, observacao: string) => void;
}

// Modal genérico de agendamento (SPEC 5.2 — botão "+ Agendar visita" e
// clique num dia do calendário, ambos pré-preenchendo a data).
export function AgendarVisitaDialog({
  open,
  onOpenChange,
  agencias,
  dataInicial,
  onConfirmar,
}: AgendarVisitaDialogProps) {
  const [agenciaId, setAgenciaId] = useState<string | null>(null);
  const [data, setData] = useState(dataInicial ?? "");
  const [hora, setHora] = useState("09:00");
  const [observacao, setObservacao] = useState("");

  function limparEFechar() {
    setAgenciaId(null);
    setData(dataInicial ?? "");
    setHora("09:00");
    setObservacao("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(novoAberto) => {
        if (!novoAberto) limparEFechar();
        else onOpenChange(true);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar visita</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-medium">Agência</label>
            <SelectField
              options={agencias.map((agencia) => ({ value: agencia.id, label: agencia.nome }))}
              value={agenciaId}
              onValueChange={setAgenciaId}
              placeholder="Selecione a agência"
              searchable
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-foreground text-sm font-medium">Data</label>
              <DatePicker value={data} onChange={setData} placeholder="Data da visita" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-sm font-medium">Hora</label>
              <input
                type="time"
                value={hora}
                onChange={(event) => setHora(event.target.value)}
                className="border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 h-full w-28 rounded-full border px-3 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-foreground text-sm font-medium">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={3}
              placeholder="Objetivo da visita..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2"
            />
          </div>

          <button
            type="button"
            disabled={!agenciaId || !data}
            onClick={() => {
              if (!agenciaId || !data) return;
              onConfirmar(agenciaId, data, hora, observacao);
              limparEFechar();
            }}
            className="bg-primary text-primary-foreground hover:bg-sakura-600 mt-1 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar agendamento
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Calendar, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { formatarDataHoraAgendada } from "@/modules/atribuicoes/utils/formatar-agenda.util";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";
import { cn } from "@/lib/utils";

interface AgendaKanbanProps {
  semVisita: AgendaAgenciaView[];
  agendadas: AgendaAgenciaView[];
  visitadas: AgendaAgenciaView[];
  onAgendar: (agenciaId: string, data: string, hora: string, observacao: string) => void;
  onMarcarVisitada: (agenciaId: string) => void;
  onConcluir: (agenciaId: string) => void;
}

// KanbanVisitBoard (SPEC 5.1) — 3 colunas independentes com scroll
// próprio. Sem backend de visita (ver types), então "Agendar"/"Concluir"
// só mudam o override local (Zustand persistido).
export function AgendaKanban({
  semVisita,
  agendadas,
  visitadas,
  onAgendar,
  onMarcarVisitada,
  onConcluir,
}: AgendaKanbanProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Coluna cor="bg-muted-foreground/40" titulo="Agências sem visita" contador={semVisita.length}>
        {semVisita.length === 0 ? (
          <EstadoVazio texto="Nenhuma agência sem visita." />
        ) : (
          semVisita.map((agencia) => (
            <CardSemVisita
              key={agencia.id}
              agencia={agencia}
              onAgendar={onAgendar}
              onMarcarVisitada={onMarcarVisitada}
            />
          ))
        )}
      </Coluna>

      <Coluna cor="bg-primary" titulo="Agências agendadas" contador={agendadas.length}>
        {agendadas.length === 0 ? (
          <EstadoVazio texto="Nenhuma agência agendada." />
        ) : (
          agendadas.map((agencia) => (
            <CardAgendada
              key={agencia.id}
              agencia={agencia}
              onAgendar={onAgendar}
              onConcluir={onConcluir}
            />
          ))
        )}
      </Coluna>

      <Coluna cor="bg-success" titulo="Agências visitadas" contador={visitadas.length}>
        {visitadas.length === 0 ? (
          <EstadoVazio texto="Nenhuma visitada." />
        ) : (
          visitadas.map((agencia) => <CardVisitada key={agencia.id} agencia={agencia} />)
        )}
      </Coluna>
    </div>
  );
}

function Coluna({
  cor,
  titulo,
  contador,
  children,
}: {
  cor: string;
  titulo: string;
  contador: number;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("size-2 rounded-full", cor)} />
        <h3 className="text-foreground text-sm font-semibold">{titulo}</h3>
        <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-semibold">
          {contador}
        </span>
      </div>
      <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function EstadoVazio({ texto }: { texto: string }) {
  return <p className="text-muted-foreground py-6 text-center text-sm">{texto}</p>;
}

function FormularioAgendamento({
  valorInicialData,
  valorInicialHora,
  valorInicialObservacao,
  onConfirmar,
  onCancelar,
}: {
  valorInicialData?: string;
  valorInicialHora?: string;
  valorInicialObservacao?: string;
  onConfirmar: (data: string, hora: string, observacao: string) => void;
  onCancelar: () => void;
}) {
  const [data, setData] = useState(valorInicialData ?? "");
  const [hora, setHora] = useState(valorInicialHora ?? "09:00");
  const [observacao, setObservacao] = useState(valorInicialObservacao ?? "");

  return (
    <div className="border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex gap-2">
        <DatePicker value={data} onChange={setData} placeholder="Data da visita" />
        <input
          type="time"
          value={hora}
          onChange={(event) => setHora(event.target.value)}
          className="border-input bg-background text-foreground focus:border-primary focus:ring-ring/30 w-24 rounded-full border px-3 py-2.5 text-sm outline-none focus:ring-2"
        />
      </div>
      <textarea
        value={observacao}
        onChange={(event) => setObservacao(event.target.value)}
        placeholder="Observação/objetivo da visita (opcional)"
        rows={2}
        className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring/30 w-full resize-none rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-xs font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!data}
          onClick={() => onConfirmar(data, hora, observacao)}
          className="bg-primary text-primary-foreground hover:bg-sakura-600 rounded-full px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

function CardSemVisita({
  agencia,
  onAgendar,
  onMarcarVisitada,
}: {
  agencia: AgendaAgenciaView;
  onAgendar: (agenciaId: string, data: string, hora: string, observacao: string) => void;
  onMarcarVisitada: (agenciaId: string) => void;
}) {
  const [agendando, setAgendando] = useState(false);

  return (
    <div className="border-border rounded-xl border p-3">
      <p className="text-foreground text-sm font-medium">{agencia.nome}</p>

      {agendando ? (
        <div className="mt-2">
          <FormularioAgendamento
            onConfirmar={(data, hora, observacao) => {
              onAgendar(agencia.id, data, hora, observacao);
              setAgendando(false);
            }}
            onCancelar={() => setAgendando(false)}
          />
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setAgendando(true)}
            className="text-primary inline-flex items-center gap-1 font-medium"
          >
            <Calendar className="size-3.5" /> Agendar
          </button>
          <button
            type="button"
            onClick={() => onMarcarVisitada(agencia.id)}
            className="text-success inline-flex items-center gap-1 font-medium"
          >
            <Check className="size-3.5" /> Visitada
          </button>
        </div>
      )}
    </div>
  );
}

function CardAgendada({
  agencia,
  onAgendar,
  onConcluir,
}: {
  agencia: AgendaAgenciaView;
  onAgendar: (agenciaId: string, data: string, hora: string, observacao: string) => void;
  onConcluir: (agenciaId: string) => void;
}) {
  const [reagendando, setReagendando] = useState(false);

  return (
    <div className="border-primary/30 bg-primary/5 rounded-xl border p-3">
      <p className="text-foreground text-sm font-medium">{agencia.nome}</p>
      <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
        <Calendar className="size-3.5" />
        {agencia.dataAgendada
          ? formatarDataHoraAgendada(agencia.dataAgendada, agencia.horaAgendada)
          : "—"}
      </p>
      {agencia.observacao ? (
        <p className="text-muted-foreground mt-1 text-xs italic">
          &ldquo;{agencia.observacao}&rdquo;
        </p>
      ) : null}

      {reagendando ? (
        <div className="mt-2">
          <FormularioAgendamento
            valorInicialData={agencia.dataAgendada ?? undefined}
            valorInicialHora={agencia.horaAgendada ?? undefined}
            valorInicialObservacao={agencia.observacao ?? undefined}
            onConfirmar={(data, hora, observacao) => {
              onAgendar(agencia.id, data, hora, observacao);
              setReagendando(false);
            }}
            onCancelar={() => setReagendando(false)}
          />
        </div>
      ) : (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setReagendando(true)}
            className="border-border text-foreground hover:bg-muted rounded-full border px-3 py-1.5 text-xs font-medium"
          >
            Reagendar
          </button>
          <button
            type="button"
            onClick={() => onConcluir(agencia.id)}
            className="bg-success text-success-foreground rounded-full px-3 py-1.5 text-xs font-semibold"
          >
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}

function CardVisitada({ agencia }: { agencia: AgendaAgenciaView }) {
  return (
    <div className="border-border rounded-xl border p-3">
      <p className="text-foreground text-sm font-medium">{agencia.nome}</p>
      {agencia.concluidaEm ? (
        <Badge variant="secondary" className="bg-success/10 text-success mt-1.5">
          Concluída
        </Badge>
      ) : null}
    </div>
  );
}

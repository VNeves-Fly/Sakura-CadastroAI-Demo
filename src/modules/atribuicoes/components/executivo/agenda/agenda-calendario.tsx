"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgendarVisitaDialog } from "@/modules/atribuicoes/components/executivo/agenda/agendar-visita-dialog";
import { formatarDataHoraAgendada } from "@/modules/atribuicoes/utils/formatar-agenda.util";
import type { AgendaAgenciaView } from "@/modules/atribuicoes/types/executivo-agenda.types";
import { cn } from "@/lib/utils";

interface AgendaCalendarioProps {
  agencias: AgendaAgenciaView[];
  onAgendar: (agenciaId: string, data: string, hora: string, observacao: string) => void;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// MonthCalendarGrid (SPEC 5.2) — grade "estilo agenda", com caixas maiores
// por dia (não o mini-calendário de date-picker), clique num dia abre o
// resumo daquele dia, e uma lista com o resumo do mês inteiro embaixo.
export function AgendaCalendario({ agencias, onAgendar }: AgendaCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [dialogAgendarAberto, setDialogAgendarAberto] = useState(false);
  const [dataParaAgendar, setDataParaAgendar] = useState<string | undefined>(undefined);

  const agendadas = useMemo(
    () => agencias.filter((a) => a.status === "agendada" && a.dataAgendada),
    [agencias],
  );

  const visitasPorDia = useMemo(() => {
    const mapa = new Map<string, AgendaAgenciaView[]>();
    for (const agencia of agendadas) {
      const chave = agencia.dataAgendada!;
      mapa.set(chave, [...(mapa.get(chave) ?? []), agencia]);
    }
    return mapa;
  }, [agendadas]);

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { locale: ptBR });
    const fim = endOfWeek(endOfMonth(mesAtual), { locale: ptBR });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const agendadasNoMes = agendadas.filter((a) =>
    isSameMonth(parse(a.dataAgendada!, "yyyy-MM-dd", new Date()), mesAtual),
  );
  const visitadasNoMes = agencias.filter(
    (a) =>
      a.status === "visitada" &&
      a.concluidaEm &&
      isSameMonth(parse(a.concluidaEm, "yyyy-MM-dd", new Date()), mesAtual),
  );

  function abrirDialogAgendar(data: Date) {
    setDataParaAgendar(format(data, "yyyy-MM-dd"));
    setDialogAgendarAberto(true);
  }

  const visitasDoDiaSelecionado = diaSelecionado
    ? (visitasPorDia.get(format(diaSelecionado, "yyyy-MM-dd")) ?? [])
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniCard label="Agendadas (mês)" valor={agendadasNoMes.length} cor="text-primary" />
        <MiniCard label="Visitadas (mês)" valor={visitadasNoMes.length} cor="text-success" />
        <MiniCard label="Total agências" valor={agencias.length} cor="text-foreground" />
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-foreground text-base font-semibold capitalize">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => abrirDialogAgendar(new Date())}
              className="bg-primary text-primary-foreground hover:bg-sakura-600 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
            >
              <CalendarPlus className="size-4" />
              Agendar visita
            </button>
            <div className="border-border flex items-center rounded-full border">
              <button
                type="button"
                onClick={() => setMesAtual((atual) => addMonths(atual, -1))}
                className="text-muted-foreground hover:text-foreground p-1.5"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setMesAtual(new Date())}
                className="text-foreground px-2 text-xs font-medium"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setMesAtual((atual) => addMonths(atual, 1))}
                className="text-muted-foreground hover:text-foreground p-1.5"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-border bg-border grid grid-cols-7 gap-px overflow-hidden rounded-xl border">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="bg-muted/50 text-muted-foreground py-2 text-center text-[11px] font-semibold tracking-wide uppercase"
            >
              {dia}
            </div>
          ))}

          {dias.map((dia) => {
            const chaveIso = format(dia, "yyyy-MM-dd");
            const visitasDoDia = visitasPorDia.get(chaveIso) ?? [];
            const foraDoMes = !isSameMonth(dia, mesAtual);
            const ehHoje = isToday(dia);

            return (
              <button
                key={chaveIso}
                type="button"
                onClick={() => setDiaSelecionado(dia)}
                className={cn(
                  "bg-card hover:bg-muted/30 flex min-h-[104px] flex-col gap-1 p-2 text-left transition",
                  foraDoMes && "bg-muted/10",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    ehHoje && "bg-primary text-primary-foreground font-bold",
                    foraDoMes && !ehHoje && "text-muted-foreground/40",
                    !foraDoMes && !ehHoje && "text-foreground",
                  )}
                >
                  {format(dia, "d")}
                </span>

                <div className="flex flex-col gap-0.5">
                  {visitasDoDia.slice(0, 3).map((visita) => (
                    <span
                      key={visita.id}
                      className="bg-primary/10 text-primary truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                    >
                      {visita.horaAgendada ? `${visita.horaAgendada} ` : ""}
                      {visita.nome}
                    </span>
                  ))}
                  {visitasDoDia.length > 3 ? (
                    <span className="text-muted-foreground text-[10px]">
                      +{visitasDoDia.length - 3} mais
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border bg-card rounded-2xl border p-5">
        <h3 className="text-foreground text-sm font-semibold">Visitas do mês</h3>
        {agendadasNoMes.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Nenhuma visita agendada para {format(mesAtual, "MMMM", { locale: ptBR })}.
          </p>
        ) : (
          <ul className="divide-border mt-3 flex flex-col divide-y">
            {[...agendadasNoMes]
              .sort((a, b) => a.dataAgendada!.localeCompare(b.dataAgendada!))
              .map((agencia) => (
                <li
                  key={agencia.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="text-foreground">{agencia.nome}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatarDataHoraAgendada(agencia.dataAgendada!, agencia.horaAgendada)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>

      <AgendarVisitaDialog
        open={dialogAgendarAberto}
        onOpenChange={setDialogAgendarAberto}
        agencias={agencias}
        dataInicial={dataParaAgendar}
        onConfirmar={onAgendar}
      />

      <Dialog
        open={diaSelecionado !== null}
        onOpenChange={(aberto) => !aberto && setDiaSelecionado(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {diaSelecionado
                ? format(diaSelecionado, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 p-4">
            {visitasDoDiaSelecionado.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma visita agendada pra esse dia.</p>
            ) : (
              <ul className="divide-border flex flex-col divide-y">
                {visitasDoDiaSelecionado.map((visita) => (
                  <li
                    key={visita.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{visita.nome}</span>
                    <span className="text-muted-foreground text-xs">
                      {visita.horaAgendada ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => {
                const data = diaSelecionado;
                setDiaSelecionado(null);
                if (data) abrirDialogAgendar(data);
              }}
              className="border-border text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium"
            >
              <CalendarPlus className="size-4" />
              Agendar visita nesse dia
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniCard({ label, valor, cor }: { label: string; valor: number; cor: string }) {
  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

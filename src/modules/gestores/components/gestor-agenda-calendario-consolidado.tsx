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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EventoAgendaGestao } from "@/modules/gestores/view-models/use-gestor-agenda-tab.view-model";

interface GestorAgendaCalendarioConsolidadoProps {
  eventos: EventoAgendaGestao[];
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mesma grade mensal de AgendaCalendario (executivo individual), mas cada
// evento é tagueado com o executivo dono (cor + nome) — não dá pra
// reaproveitar o componente original porque ele assume uma carteira só,
// sem noção de "de quem" é cada visita.
export function GestorAgendaCalendarioConsolidado({
  eventos,
}: GestorAgendaCalendarioConsolidadoProps) {
  const [mesAtual, setMesAtual] = useState(() => new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, EventoAgendaGestao[]>();
    for (const evento of eventos) {
      const chave = evento.agencia.dataAgendada!;
      mapa.set(chave, [...(mapa.get(chave) ?? []), evento]);
    }
    return mapa;
  }, [eventos]);

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { locale: ptBR });
    const fim = endOfWeek(endOfMonth(mesAtual), { locale: ptBR });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const eventosDoDiaSelecionado = diaSelecionado
    ? (eventosPorDia.get(format(diaSelecionado, "yyyy-MM-dd")) ?? [])
    : [];

  const totalNoMes = eventos.filter((evento) =>
    isSameMonth(parse(evento.agencia.dataAgendada!, "yyyy-MM-dd", new Date()), mesAtual),
  ).length;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-foreground text-base font-semibold capitalize">
            {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <p className="text-muted-foreground text-xs">{totalNoMes} visita(s) agendada(s)</p>
        </div>
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
          const eventosDoDia = eventosPorDia.get(chaveIso) ?? [];
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
                {eventosDoDia.slice(0, 3).map((evento) => (
                  <span
                    key={evento.agencia.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                      evento.cor.bg,
                      evento.cor.text,
                    )}
                  >
                    {evento.agencia.horaAgendada ? `${evento.agencia.horaAgendada} ` : ""}
                    {evento.executivoNome.split(" ")[0]} · {evento.agencia.nome}
                  </span>
                ))}
                {eventosDoDia.length > 3 ? (
                  <span className="text-muted-foreground text-[10px]">
                    +{eventosDoDia.length - 3} mais
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

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
            {eventosDoDiaSelecionado.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma visita agendada pra esse dia.</p>
            ) : (
              <ul className="divide-border flex flex-col divide-y">
                {eventosDoDiaSelecionado.map((evento) => (
                  <li
                    key={evento.agencia.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground">{evento.agencia.nome}</span>
                      <span
                        className={cn(
                          "w-fit rounded-full px-2 py-0.5 text-[10px] font-medium",
                          evento.cor.bg,
                          evento.cor.text,
                        )}
                      >
                        {evento.executivoNome}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {evento.agencia.horaAgendada ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

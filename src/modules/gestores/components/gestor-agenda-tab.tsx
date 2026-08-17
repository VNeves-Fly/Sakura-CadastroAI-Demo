"use client";

import { SelectField } from "@/components/ui/select-field";
import { GestorKpiCard } from "@/modules/gestores/components/dashboard/gestor-kpi-card";
import { GestorAgendaCalendarioConsolidado } from "@/modules/gestores/components/gestor-agenda-calendario-consolidado";
import { GestorAgendaIndividual } from "@/modules/gestores/components/gestor-agenda-individual";
import { useGestorAgendaTabViewModel } from "@/modules/gestores/view-models/use-gestor-agenda-tab.view-model";
import { formatarDataHoraAgendada } from "@/modules/atribuicoes/utils/formatar-agenda.util";
import { cn } from "@/lib/utils";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";

interface GestorAgendaTabProps {
  executivos: ExecutivoComCarteira[];
}

const TAMANHO_LISTA_PROXIMAS = 10;

// Aba "Agenda" do detalhe do Gestor (SPEC seção 7, specdetalhesgestor.md).
// Simplifiquei o desenho original (2 selects redundantes na seção 7.1) num
// único seletor "Executivo": "Todos" mostra o modo consolidado da gestão
// (KPIs + chips + calendário multi-executivo); escolher um nome mostra a
// agenda individual daquele executivo (kanban/calendário/lista), igual à
// página dele mesmo. Satisfaz os dois requisitos funcionais da seção 11.2.
export function GestorAgendaTab({ executivos }: GestorAgendaTabProps) {
  const {
    opcoesExecutivo,
    executivoSelecionadoId,
    setExecutivoSelecionadoId,
    executivoSelecionado,
    agendaPorExecutivo,
    eventosAgendados,
    kpis,
  } = useGestorAgendaTabViewModel(executivos);

  const proximasAgendadas = [...eventosAgendados]
    .sort((a, b) => (a.agencia.dataAgendada ?? "").localeCompare(b.agencia.dataAgendada ?? ""))
    .slice(0, TAMANHO_LISTA_PROXIMAS);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Agenda da gestão</h2>
          <p className="text-muted-foreground text-xs">
            Escolha um executivo pra abrir o kanban individual, ou deixe em &quot;Todos&quot; pra
            ver o calendário consolidado da gestão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
            Executivo:
          </span>
          <SelectField
            value={executivoSelecionadoId}
            onValueChange={(valor) => setExecutivoSelecionadoId(valor ?? "todos")}
            options={[
              { value: "todos", label: `Todos os executivos (${opcoesExecutivo.length})` },
              ...opcoesExecutivo.map((executivo) => ({
                value: executivo.id,
                label: executivo.nome,
              })),
            ]}
          />
        </div>
      </div>

      {executivoSelecionado ? (
        <GestorAgendaIndividual
          executivoId={executivoSelecionado.id}
          agencias={executivoSelecionado.agencias}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <GestorKpiCard
              label="Agendadas (gestão)"
              value={kpis.agendadasGestao}
              valueClassName="text-warning"
            />
            <GestorKpiCard
              label="Visitadas (gestão)"
              value={kpis.visitadasGestao}
              valueClassName="text-success"
            />
            <GestorKpiCard
              label="Executivos com agenda"
              value={`${kpis.executivosComAgenda}/${kpis.totalExecutivos}`}
            />
          </div>

          {agendaPorExecutivo.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {agendaPorExecutivo.map((exec) => (
                <button
                  key={exec.executivoId}
                  type="button"
                  onClick={() => setExecutivoSelecionadoId(exec.executivoId)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80",
                    exec.cor.bg,
                    exec.cor.text,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", exec.cor.dot)} />
                  {exec.executivoNome}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum executivo nesta gestão ainda.</p>
          )}

          <GestorAgendaCalendarioConsolidado eventos={eventosAgendados} />

          <div className="border-border bg-card rounded-2xl border p-5">
            <h3 className="text-foreground text-sm font-semibold">Próximas agendadas</h3>
            {proximasAgendadas.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                Nenhuma visita agendada na gestão.
              </p>
            ) : (
              <ul className="divide-border mt-3 flex flex-col divide-y">
                {proximasAgendadas.map((evento) => (
                  <li
                    key={evento.agencia.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="text-primary w-32 shrink-0 text-xs font-medium">
                      {formatarDataHoraAgendada(
                        evento.agencia.dataAgendada!,
                        evento.agencia.horaAgendada,
                      )}
                    </span>
                    <span className="text-foreground flex-1 truncate">{evento.agencia.nome}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        evento.cor.bg,
                        evento.cor.text,
                      )}
                    >
                      {evento.executivoNome}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

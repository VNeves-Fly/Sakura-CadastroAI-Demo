"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useFiltroPeriodoDashboardStore,
  type FiltroPeriodoDashboard,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const FORMATO = "dd/MM/yyyy";

// Sem "Este" antes de mês/ano — pedido do usuário, 2026-08-20.
const ATALHOS: { valor: FiltroPeriodoDashboard; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

const LABEL_ATALHO: Record<Exclude<FiltroPeriodoDashboard, "personalizado">, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

function parseOuNull(valor: string): Date | null {
  const data = parse(valor, FORMATO, new Date());
  return isValid(data) ? startOfDay(data) : null;
}

function mesComTitulo(mes: Date): string {
  const rotulo = format(mes, "MMMM yyyy", { locale: ptBR });
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}

// Grade de um mês: só os dias 1..N desse mês, alinhados por dia da semana
// — sem preencher com dias do mês adjacente (célula fica null/vazia).
// Mesma lógica de components/ui/personalizado-date-range.tsx — duplicada
// aqui de propósito (em vez de compartilhar um módulo) pra não arriscar
// regressão nos outros 2 consumidores daquele componente (hero do
// Executivo em atribuicoes/, fora do escopo desta tarefa).
function diasDoMes(mes: Date): (Date | null)[] {
  const inicio = startOfMonth(mes);
  const fim = endOfMonth(mes);
  const grade: (Date | null)[] = new Array(inicio.getDay()).fill(null);
  for (const dia of eachDayOfInterval({ start: inicio, end: fim })) {
    grade.push(dia);
  }
  return grade;
}

function PainelMes({
  mes,
  hoje,
  inicio,
  fim,
  onSelecionar,
}: {
  mes: Date;
  hoje: Date;
  inicio: Date | null;
  fim: Date | null;
  onSelecionar: (dia: Date) => void;
}) {
  return (
    <div className="flex-1">
      <p className="text-foreground mb-3 text-center text-sm font-bold">{mesComTitulo(mes)}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia} className="text-muted-foreground pb-1 text-[11px] font-semibold">
            {dia}
          </span>
        ))}
        {diasDoMes(mes).map((dia, indice) => {
          if (!dia) return <span key={`vazio-${indice}`} />;

          const futuro = isAfter(dia, hoje);
          const noIntervalo =
            inicio && fim ? isWithinInterval(dia, { start: inicio, end: fim }) : false;
          const éInicio = inicio ? isSameDay(dia, inicio) : false;
          const éFim = fim ? isSameDay(dia, fim) : false;
          const extremidade = éInicio || éFim;

          return (
            <button
              key={dia.toISOString()}
              type="button"
              disabled={futuro}
              onClick={() => onSelecionar(dia)}
              className={cn(
                "flex h-9 items-center justify-center text-sm transition disabled:cursor-not-allowed",
                futuro && "text-muted-foreground/40",
                !futuro && !noIntervalo && "text-foreground hover:bg-muted rounded-full",
                noIntervalo && !extremidade && "bg-primary/10 text-primary font-semibold",
                extremidade && "bg-primary rounded-full font-bold text-white",
                éInicio && !éFim && "rounded-r-none",
                éFim && !éInicio && "rounded-l-none",
              )}
            >
              {format(dia, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Filtro único do cabeçalho do Dashboard CRM — substitui as 5 pills
// soltas (Hoje/Ontem/Este mês/Este ano/Personalizado) + o botão de
// intervalo que só aparecia quando "Personalizado" estava ativo. Agora é
// um botão só, que abre este popover com os atalhos de período + o
// calendário de intervalo personalizado juntos — reaproveitando o mesmo
// card do filtro "Personalizado" que já existia (pedido do usuário,
// 2026-08-20, print de referência). Lê/escreve direto na store global
// (filtro-periodo-dashboard.store.ts): os atalhos (Hoje/Ontem/Este mês/
// Este ano) aplicam na hora ao clicar; o intervalo do calendário segue
// exigindo "Aplicar período" (é um gesto de dois cliques — início e fim
// —, não dá pra aplicar sozinho no primeiro clique).
export function FiltroPeriodoDashboardPopover() {
  const { filtro, setFiltro, dataInicial, setDataInicial, dataFinal, setDataFinal } =
    useFiltroPeriodoDashboardStore();

  const hoje = startOfDay(new Date());
  const padraoInicio = startOfMonth(hoje);

  const [aberto, setAberto] = useState(false);
  const [rascunhoInicio, setRascunhoInicio] = useState<Date>(
    () => parseOuNull(dataInicial) ?? padraoInicio,
  );
  const [rascunhoFim, setRascunhoFim] = useState<Date>(() => parseOuNull(dataFinal) ?? hoje);
  const [mesEsquerda, setMesEsquerda] = useState(() => subMonths(startOfMonth(rascunhoFim), 1));
  // true = próximo clique define o fim do intervalo (já tem início); false
  // = intervalo já fechado, próximo clique começa um intervalo novo.
  const [aindaNaoEscolheuFim, setAindaNaoEscolheuFim] = useState(false);

  // Reabrir sempre parte do último período aplicado, não do rascunho
  // anterior descartado num "Cancelar".
  useEffect(() => {
    if (!aberto) return;
    const inicio = parseOuNull(dataInicial) ?? padraoInicio;
    const fim = parseOuNull(dataFinal) ?? hoje;
    setRascunhoInicio(inicio);
    setRascunhoFim(fim);
    setMesEsquerda(subMonths(startOfMonth(fim), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  function selecionarDia(dia: Date) {
    if (!aindaNaoEscolheuFim) {
      setRascunhoInicio(dia);
      setRascunhoFim(dia);
      setAindaNaoEscolheuFim(true);
      return;
    }

    if (isBefore(dia, rascunhoInicio)) {
      setRascunhoFim(rascunhoInicio);
      setRascunhoInicio(dia);
    } else {
      setRascunhoFim(dia);
    }
    setAindaNaoEscolheuFim(false);
  }

  function selecionarAtalho(valor: FiltroPeriodoDashboard) {
    setFiltro(valor);
    setAberto(false);
  }

  function aplicarPeriodoPersonalizado() {
    setDataInicial(format(rascunhoInicio, FORMATO));
    setDataFinal(format(rascunhoFim, FORMATO));
    setFiltro("personalizado");
    setAberto(false);
  }

  const mesDireita = addMonths(mesEsquerda, 1);
  const totalDias = eachDayOfInterval({ start: rascunhoInicio, end: rascunhoFim }).length;

  const rotuloAtual =
    filtro === "personalizado"
      ? dataInicial && dataFinal
        ? `${dataInicial} - ${dataFinal}`
        : "Selecionar período"
      : LABEL_ATALHO[filtro];

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "bg-background inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              aberto ? "border-info ring-info/25 ring-2" : "border-input hover:border-info/50",
            )}
          />
        }
      >
        <CalendarDays className="text-primary size-3.5" />
        <span className="text-muted-foreground">Período</span>
        <span className="text-primary font-bold">{rotuloAtual}</span>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-auto max-w-[95vw] p-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {ATALHOS.map((atalho) => (
            <button
              key={atalho.valor}
              type="button"
              onClick={() => selecionarAtalho(atalho.valor)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition",
                filtro === atalho.valor
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-primary/30 text-primary hover:bg-primary/5",
              )}
            >
              {atalho.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-8 shrink-0"
            onClick={() => setMesEsquerda((atual) => subMonths(atual, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <PainelMes
              mes={mesEsquerda}
              hoje={hoje}
              inicio={rascunhoInicio}
              fim={rascunhoFim}
              onSelecionar={selecionarDia}
            />
            <PainelMes
              mes={mesDireita}
              hoje={hoje}
              inicio={rascunhoInicio}
              fim={rascunhoFim}
              onSelecionar={selecionarDia}
            />
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-8 shrink-0"
            onClick={() => setMesEsquerda((atual) => addMonths(atual, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="border-border mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-semibold">{format(rascunhoInicio, FORMATO)}</span>
            {" – "}
            <span className="text-foreground font-semibold">{format(rascunhoFim, FORMATO)}</span>
            {"  ·  "}
            {totalDias} {totalDias === 1 ? "dia" : "dias"}
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={aplicarPeriodoPersonalizado}>
              Aplicar período
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

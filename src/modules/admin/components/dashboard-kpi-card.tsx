"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { Info, Maximize2, Minimize2, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KpiAreaChart } from "@/modules/admin/components/kpi-area-chart";

export type Periodo = "dia" | "mes" | "ano";

const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "dia", label: "DIA" },
  { valor: "mes", label: "MÊS" },
  { valor: "ano", label: "ANO" },
];

// Texto que acompanha o valor grande — ele mostra o balde ATUAL da série
// (hoje/este mês/este ano), não um total acumulado do período inteiro.
const DESCRICAO_PERIODO_ATUAL: Record<Periodo, string> = {
  dia: "hoje",
  mes: "neste mês",
  ano: "neste ano",
};

// Mesmo shape de SeriePeriodoItem (ver agencia-repository.ts), duck-typed
// aqui igual antes (mesma convenção dos componentes irmãos).
interface SeriePeriodoItem {
  periodo: string;
  quantidade: number;
}

interface DashboardKpiCardProps {
  icon: LucideIcon;
  titulo: string;
  // Sem janela de tempo (ex.: "novos cadastros") — o card monta o resto
  // ("hoje"/"neste mês"/"neste ano") a partir do período efetivo.
  descricaoBase: string;
  cor: string;
  series: { dia: SeriePeriodoItem[]; mes: SeriePeriodoItem[]; ano: SeriePeriodoItem[] };
  // Explica um valor que não é autoexplicativo (breakdown aberto/pendente
  // da Análise de Documentos) — desacoplado do valor grande, que agora é
  // sempre o balde atual (hoje/este mês/este ano) do período selecionado.
  tooltip?: ReactNode;
  expandido: boolean;
  // Um dos 3 cards "não escolhidos" enquanto outro está expandido — versão
  // visual reduzida (ver DashboardKpisGrid, grid achatado 3x3).
  compacto: boolean;
  // Abaixo do breakpoint xl o layout 2/3+1/3 não cabe — some o botão de
  // expandir nesse caso (ver useMediaQuery em DashboardKpisGrid).
  podeExpandir: boolean;
  periodo: Periodo;
  onToggleExpandir: () => void;
  onMudarPeriodo: (periodo: Periodo) => void;
  style?: CSSProperties;
}

export function DashboardKpiCard({
  icon: Icon,
  titulo,
  descricaoBase,
  cor,
  series,
  tooltip,
  expandido,
  compacto,
  podeExpandir,
  periodo,
  onToggleExpandir,
  onMudarPeriodo,
  style,
}: DashboardKpiCardProps) {
  // Colapsado sempre usa "dia" internamente — os pills só existem quando
  // expandido, então não há como um card colapsado mostrar mês/ano sem
  // nenhuma pista visual de qual período está ativo.
  const periodoEfetivo = expandido ? periodo : "dia";
  const pontos = series[periodoEfetivo];
  // Último ponto da série = o balde "atual" (bucketarPorPeriodo preenche do
  // mais antigo pro mais recente, terminando em hoje/este mês/este ano) —
  // o valor grande mostra esse balde, não a soma de toda a janela do
  // gráfico (que é só o histórico/tendência ao lado).
  const valorAtual = pontos[pontos.length - 1]?.quantidade ?? 0;
  const descricao = `${descricaoBase} ${DESCRICAO_PERIODO_ATUAL[periodoEfetivo]}`;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={style}
      className="border-border bg-card flex min-w-0 flex-col rounded-2xl border p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl transition-all ${
              compacto ? "size-9" : "size-11 sm:size-12"
            }`}
            style={{ backgroundColor: cor }}
          >
            <Icon className={compacto ? "size-4 text-white" : "size-5 text-white sm:size-6"} />
          </span>
          <h2
            className={`min-w-0 truncate leading-tight font-extrabold ${
              compacto ? "text-sm" : "text-lg sm:text-xl"
            }`}
            style={{ color: cor }}
          >
            {titulo}
          </h2>
          {tooltip && !compacto ? (
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-muted-foreground size-4 shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        {expandido ? (
          <div className="flex shrink-0 items-center gap-2">
            <div className="bg-muted flex items-center gap-1 rounded-full p-1">
              {PERIODOS.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => onMudarPeriodo(p.valor)}
                  className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition sm:px-3 sm:text-xs ${
                    periodo === p.valor
                      ? "text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={periodo === p.valor ? { backgroundColor: cor } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleExpandir}
              aria-label="Recolher card"
              aria-expanded={expandido}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full border transition"
            >
              <Minimize2 className="size-4" />
            </button>
          </div>
        ) : podeExpandir ? (
          <button
            type="button"
            onClick={onToggleExpandir}
            aria-label="Expandir card"
            aria-expanded={expandido}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full border transition"
          >
            <Maximize2 className="size-4" />
          </button>
        ) : null}
      </div>

      <div className={`mt-4 flex min-w-0 items-center gap-3 ${expandido ? "min-h-0 flex-1" : ""}`}>
        <p
          className={`text-foreground shrink-0 font-black break-words ${
            compacto ? "text-xl" : "text-3xl sm:text-4xl"
          }`}
        >
          {valorAtual.toLocaleString("pt-BR")}
        </p>
        <div
          className={
            compacto
              ? "h-8 min-w-0 flex-1"
              : expandido
                ? "h-full min-w-0 flex-1"
                : "h-12 min-w-0 flex-1 sm:h-14"
          }
        >
          <KpiAreaChart dados={pontos} cor={cor} expandido={expandido} />
        </div>
      </div>
      {!compacto && <p className="text-muted-foreground mt-1 text-xs break-words">{descricao}</p>}
    </motion.div>
  );
}

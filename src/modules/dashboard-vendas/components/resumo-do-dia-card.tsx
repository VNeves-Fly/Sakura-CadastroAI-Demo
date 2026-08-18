"use client";

import { useState } from "react";
import { Bus, Clock, Info, Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { ComparisonSplitCard } from "@/modules/dashboard-vendas/components/ui/comparison-split-card";
import { formatarAtualizadoEm } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import {
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
import { mascararData } from "@/modules/dashboard-vendas/utils/mascara-data.util";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";
import type {
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// "Personalizado" é só de UI por enquanto — não existe (ainda) uma fonte
// de dados que calcule um intervalo arbitrário de datas (isso exigiria
// uma consulta nova no back-end, fora do escopo atual, que é só front-end
// — decisão do usuário, 2026-08-18). Enquanto isso, mostra a prévia de
// "Este mês" com um aviso deixando claro que o filtro ainda não está
// conectado a um cálculo real.
type FiltroResumo = PeriodoResumo | "personalizado";
const PERIODO_PREVIA_PERSONALIZADO: PeriodoResumo = "mes";

const OPCOES_PERIODO: { valor: FiltroResumo; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Este mês" },
  { valor: "ano", label: "Este ano" },
  { valor: "personalizado", label: "Personalizado" },
];

interface ResumoDoDiaCardProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
}

// 4.1 — KPI principal do topo, seletor de período e o par Aéreo/Terrestre
// com a barra de proporção. Todo o toggle é local/client-side: os 4
// cenários já vêm calculados na fixture, sem refetch.
export function ResumoDoDiaCard({ resumoPorPeriodo }: ResumoDoDiaCardProps) {
  const [filtro, setFiltro] = useState<FiltroResumo>("hoje");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const personalizado = filtro === "personalizado";
  const periodoComDados: PeriodoResumo = personalizado ? PERIODO_PREVIA_PERSONALIZADO : filtro;
  const resumo = resumoPorPeriodo[periodoComDados];
  const totalPeriodo = resumo.aereo.valor + resumo.terrestre.valor;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="bg-clip-text text-4xl font-black break-words text-transparent sm:text-[42px]"
            style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
          >
            {formatarMoedaBrl(totalPeriodo)}
          </p>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" />
            Atualizado em {formatarAtualizadoEm(resumo.atualizadoEm)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <PeriodToggle opcoes={OPCOES_PERIODO} valor={filtro} onChange={setFiltro} />

          {personalizado ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <PillDataInput
                label="Data inicial"
                valor={dataInicial}
                onChange={(valor) => setDataInicial(mascararData(valor))}
              />
              <span className="text-muted-foreground text-xs font-bold">–</span>
              <PillDataInput
                label="Data final"
                valor={dataFinal}
                onChange={(valor) => setDataFinal(mascararData(valor))}
              />
            </div>
          ) : null}
        </div>
      </div>

      {personalizado ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
          <Info className="size-3.5 shrink-0" />
          Prévia com os dados de &ldquo;Este mês&rdquo; — filtro por intervalo de datas ainda não
          conectado a um cálculo real.
        </p>
      ) : null}

      <div className="mt-5">
        <ComparisonSplitCard
          progressoEsquerdaPct={resumo.aereo.participacaoPct}
          participacaoEsquerda={formatarPercentual(resumo.aereo.participacaoPct)}
          participacaoDireita={formatarPercentual(resumo.terrestre.participacaoPct)}
          esquerda={{
            icon: Plane,
            cor: COR_ROSA,
            corFundoIcone: COR_ROSA_BG,
            label: "Aéreo",
            valor: formatarMoedaBrl(resumo.aereo.valor),
            legenda: `${resumo.aereo.quantidade} bilhetes`,
            badgeRodape: `MARGEM ${formatarPercentual(resumo.aereo.margemPct)}`,
            orientacao: "horizontal",
          }}
          direita={{
            icon: Bus,
            cor: COR_AZUL,
            corFundoIcone: COR_AZUL_BG,
            label: "Terrestre",
            valor: formatarMoedaBrl(resumo.terrestre.valor),
            legenda: `${resumo.terrestre.quantidade} vendas`,
            badgeRodape: `MARGEM ${formatarPercentual(resumo.terrestre.margemPct)}`,
            orientacao: "horizontal",
          }}
        />
      </div>
    </div>
  );
}

// Campo de data no mesmo desenho visual dos pills do `PeriodToggle`
// (bg-muted + rounded-full) — texto livre com máscara dd/mm/aaaa, sem
// calendário: o analista digita a data direto.
function PillDataInput({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className="bg-muted flex items-center gap-1 rounded-full py-1 pr-1 pl-2.5 sm:gap-1.5 sm:py-1.5 sm:pl-3">
      <span className="text-muted-foreground text-[10px] font-bold tracking-wide whitespace-nowrap sm:text-xs">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        className="bg-card text-foreground placeholder:text-muted-foreground w-20 rounded-full px-1.5 py-1 text-[11px] font-semibold outline-none sm:w-[92px] sm:px-2 sm:text-xs"
      />
    </label>
  );
}

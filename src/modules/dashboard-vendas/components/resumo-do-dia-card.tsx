"use client";

import { Bus, Clock, Plane } from "lucide-react";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import { NacIntMiniBar } from "@/modules/dashboard-vendas/components/ui/nac-int-mini-bar";
import { PersonalizadoDateRange } from "@/modules/dashboard-vendas/components/ui/personalizado-date-range";
import { PersonalizadoAviso } from "@/modules/dashboard-vendas/components/ui/personalizado-aviso";
import { formatarAtualizadoEm } from "@/modules/dashboard-vendas/utils/formatar-data.util";
import {
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";
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
export type FiltroResumo = PeriodoResumo | "personalizado";
export const PERIODO_PREVIA_PERSONALIZADO: PeriodoResumo = "mes";

const OPCOES_PERIODO: { valor: FiltroResumo; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Este mês" },
  { valor: "ano", label: "Este ano" },
  { valor: "personalizado", label: "Personalizado" },
];

interface ResumoDoDiaCardProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
  // Estado do filtro controlado pelo pai (ResumoDoDiaComMiniKpis) — os
  // mini-KPIs de baixo (Clientes/Bilhetes/Ticket Médio) precisam do mesmo
  // período selecionado aqui, então não pode mais ser state interno
  // (corrigido 2026-08-19, ver comentário em mini-kpis-grid.tsx).
  filtro: FiltroResumo;
  onFiltroChange: (filtro: FiltroResumo) => void;
  dataInicial: string;
  onDataInicialChange: (valor: string) => void;
  dataFinal: string;
  onDataFinalChange: (valor: string) => void;
}

// 4.1 — KPI principal do topo, seletor de período e o par Aéreo/Terrestre,
// cada um com sua barra de share Nacional/Internacional embaixo. Todo o
// toggle é local/client-side: os 4 cenários já vêm calculados na fixture,
// sem refetch.
export function ResumoDoDiaCard({
  resumoPorPeriodo,
  filtro,
  onFiltroChange,
  dataInicial,
  onDataInicialChange,
  dataFinal,
  onDataFinalChange,
}: ResumoDoDiaCardProps) {
  const personalizado = filtro === "personalizado";
  const periodoComDados: PeriodoResumo = personalizado ? PERIODO_PREVIA_PERSONALIZADO : filtro;
  const resumo = resumoPorPeriodo[periodoComDados];
  const totalPeriodo = resumo.aereo.valor + resumo.terrestre.valor;
  // Ticket médio por canal — computado aqui mesmo (valor / quantidade),
  // sem precisar de dado novo (pedido do usuário, 2026-08-19).
  const ticketMedioAereo =
    resumo.aereo.quantidade > 0 ? resumo.aereo.valor / resumo.aereo.quantidade : 0;
  const ticketMedioTerrestre =
    resumo.terrestre.quantidade > 0 ? resumo.terrestre.valor / resumo.terrestre.quantidade : 0;

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="bg-clip-text text-4xl font-black break-words text-transparent sm:text-[42px]"
              style={{ backgroundImage: "linear-gradient(90deg, #EC0C8C, #8B5CF6, #3B82F6)" }}
            >
              {formatarMoedaBrl(totalPeriodo)}
            </p>
            {/* Margem combinada Aéreo+Terrestre (overview.filial.total),
                separada da margem de cada canal mostrada nos cards abaixo
                (pedido do usuário, 2026-08-19). */}
            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-bold">
              MARGEM TOTAL {formatarPercentual(resumo.margemTotalPct)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" />
            Atualizado em {formatarAtualizadoEm(resumo.atualizadoEm)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <PeriodToggle opcoes={OPCOES_PERIODO} valor={filtro} onChange={onFiltroChange} />

          {personalizado ? (
            <PersonalizadoDateRange
              dataInicial={dataInicial}
              dataFinal={dataFinal}
              onDataInicialChange={onDataInicialChange}
              onDataFinalChange={onDataFinalChange}
            />
          ) : null}
        </div>
      </div>

      {personalizado ? <PersonalizadoAviso periodoPreviaLabel="Este mês" /> : null}

      {/* Grid Aéreo/Terrestre — substitui a barra única de proporção
          Aéreo x Terrestre que existia antes aqui (pedido do usuário,
          2026-08-19, print de referência). Cada canal tem seu próprio
          share Nacional/Internacional (nacIntDetalhe vem do mesmo bucket
          de origem que valor/margem daquele canal — não é o mesmo dado
          duplicado entre os dois). */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <KpiCard
            icon={Plane}
            cor={COR_ROSA}
            corFundoIcone={COR_ROSA_BG}
            label="Aéreo"
            valor={formatarMoedaBrl(resumo.aereo.valor)}
            legenda={
              <>
                {resumo.aereo.quantidade} bilhetes
                <br />
                Ticket médio: {formatarMoedaBrl(ticketMedioAereo)}
              </>
            }
            badgeRodape={`MARGEM ${formatarPercentual(resumo.aereo.margemPct)}`}
            orientacao="horizontal"
          />
          <NacIntMiniBar nacIntDetalhe={resumo.aereo.nacIntDetalhe} />
        </div>

        <div>
          <KpiCard
            icon={Bus}
            cor={COR_AZUL}
            corFundoIcone={COR_AZUL_BG}
            label="Terrestre"
            valor={formatarMoedaBrl(resumo.terrestre.valor)}
            legenda={
              <>
                {resumo.terrestre.quantidade} vendas
                <br />
                Ticket médio: {formatarMoedaBrl(ticketMedioTerrestre)}
              </>
            }
            badgeRodape={`MARGEM ${formatarPercentual(resumo.terrestre.margemPct)}`}
            orientacao="horizontal"
          />
          <NacIntMiniBar nacIntDetalhe={resumo.terrestre.nacIntDetalhe} />
        </div>
      </div>
    </div>
  );
}

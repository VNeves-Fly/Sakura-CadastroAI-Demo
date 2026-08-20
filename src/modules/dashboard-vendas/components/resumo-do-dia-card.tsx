"use client";

import { Bus, Clock, Plane } from "lucide-react";
import { KpiCard } from "@/modules/dashboard-vendas/components/ui/kpi-card";
import { NacIntMiniBar } from "@/modules/dashboard-vendas/components/ui/nac-int-mini-bar";
import { FiltroPeriodoDashboardPopover } from "@/modules/dashboard-vendas/components/ui/filtro-periodo-dashboard-popover";
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
import {
  useFiltroPeriodoDashboardStore,
  resolverPeriodo,
} from "@/modules/dashboard-vendas/stores/filtro-periodo-dashboard.store";
import type {
  PeriodoResumo,
  ResumoDia,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

interface ResumoDoDiaCardProps {
  resumoPorPeriodo: Record<PeriodoResumo, ResumoDia>;
}

// 4.1 — KPI principal do topo, seletor de período e o par Aéreo/Terrestre,
// cada um com sua barra de share Nacional/Internacional embaixo. Filtro de
// período agora vem da store global (`useFiltroPeriodoDashboardStore`) —
// dirige também os mini-KPIs de baixo e os rankings de Top 10 Agências/
// Fornecedores (pedido do usuário, 2026-08-20; antes era state local só
// deste card, levantado uma vez até `ResumoDoDiaComMiniKpis` em 2026-08-19).
export function ResumoDoDiaCard({ resumoPorPeriodo }: ResumoDoDiaCardProps) {
  const filtro = useFiltroPeriodoDashboardStore((estado) => estado.filtro);
  const personalizado = filtro === "personalizado";
  const periodoComDados: PeriodoResumo = resolverPeriodo(filtro);
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

        <FiltroPeriodoDashboardPopover />
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

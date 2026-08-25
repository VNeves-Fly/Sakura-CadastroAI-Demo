import { Bus, CalendarDays, Clock, Plane, Ticket, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import {
  COR_AZUL,
  COR_AZUL_BG,
  COR_ROSA,
  COR_ROSA_BG,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";

// Placeholder de ResumoDoDiaCard + MiniKpisGrid (ver resumo-do-dia-card.tsx
// e mini-kpis-grid.tsx) enquanto obterResumoEDia() resolve via Suspense
// (ver dashboard-vendas-view.tsx). Reproduz o chrome real — moldura,
// ícones, labels — que não depende do SST, e só troca por LoadingBall os
// números/valores e por Skeleton o que não tem formato conhecido
// antecipadamente (legenda de bilhetes/ticket médio). Mesmo espírito de
// tv-skeleton.tsx.

function KpiCardSkeleton({
  icon: Icon,
  cor,
  corFundoIcone,
  label,
  legenda,
  comBadgeMargem,
}: {
  icon: LucideIcon;
  cor: string;
  corFundoIcone: string;
  label: string;
  legenda: ReactNode;
  comBadgeMargem?: boolean;
}) {
  // Molde horizontal de KpiCard (ver ui/kpi-card.tsx).
  return (
    <div className="border-border bg-card relative flex flex-col gap-2 rounded-2xl border p-4 sm:p-5">
      {comBadgeMargem ? (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1 sm:top-5 sm:right-5">
          <span className="text-primary text-sm font-bold tracking-wide sm:text-base">
            <LoadingBall size="xs" />
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-12"
          style={{ backgroundColor: corFundoIcone }}
        >
          <Icon className="size-5 sm:size-6" style={{ color: cor }} />
        </span>
        <div className={comBadgeMargem ? "min-w-0 flex-1 pr-16 sm:pr-24" : "min-w-0 flex-1"}>
          <p
            className="text-[10px] font-bold tracking-wide uppercase sm:text-[11px]"
            style={{ color: cor }}
          >
            {label}
          </p>
          <div className="mt-1 flex h-[1.6em] items-center sm:h-[1.9em]">
            <LoadingBall size="lg" />
          </div>
          {legenda}
        </div>
      </div>
    </div>
  );
}

function NacIntMiniBarSkeleton() {
  // Molde de NacIntMiniBar (ver ui/nac-int-mini-bar.tsx) — barra e
  // percentuais dependem do split Nacional x Internacional do SST.
  return (
    <div className="mt-2 flex flex-col gap-1.5 px-1">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-[11px] font-bold tracking-wide">NAC</span>
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full" />
        <span className="text-muted-foreground text-[11px] font-bold tracking-wide">INT</span>
      </div>
      <div className="flex items-center justify-between">
        <LoadingBall size="xs" />
        <LoadingBall size="xs" />
      </div>
    </div>
  );
}

export function ResumoDoDiaSkeleton() {
  return (
    <>
      <div className="border-border bg-card rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-9 items-center sm:h-10">
                <LoadingBall size="xl" />
              </div>
              <span className="text-primary flex items-center gap-1 text-xs font-bold">
                MARGEM TOTAL <LoadingBall size="xs" />
              </span>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <Clock className="size-3.5" />
              Atualizado em <LoadingBall size="xs" />
            </p>
          </div>

          {/* Chrome fechado de FiltroPeriodoDashboardPopover (ver
              ui/filtro-periodo-dashboard-popover.tsx) — o rótulo do período
              selecionado vem da store client-side, só interativo depois de
              hidratar. */}
          <span className="bg-background border-input inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
            <CalendarDays className="text-primary size-3.5" />
            <span className="text-muted-foreground">Período</span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <KpiCardSkeleton
              icon={Plane}
              cor={COR_ROSA}
              corFundoIcone={COR_ROSA_BG}
              label="Aéreo"
              comBadgeMargem
              legenda={
                <div className="mt-0.5 flex flex-col gap-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              }
            />
            <NacIntMiniBarSkeleton />
          </div>

          <div>
            <KpiCardSkeleton
              icon={Bus}
              cor={COR_AZUL}
              corFundoIcone={COR_AZUL_BG}
              label="Terrestre"
              comBadgeMargem
              legenda={
                <div className="mt-0.5 flex flex-col gap-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              }
            />
            <NacIntMiniBarSkeleton />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KpiCardSkeleton
          icon={Users}
          cor={COR_ROSA}
          corFundoIcone={COR_ROSA_BG}
          label="Agências"
          legenda={<p className="text-muted-foreground mt-0.5 text-xs">agências distintas</p>}
        />
        <KpiCardSkeleton
          icon={Ticket}
          cor={COR_ROSA}
          corFundoIcone={COR_ROSA_BG}
          label="Bilhetes (Aéreo)"
          legenda={<p className="text-muted-foreground mt-0.5 text-xs">bilhetes emitidos</p>}
        />
      </div>
    </>
  );
}

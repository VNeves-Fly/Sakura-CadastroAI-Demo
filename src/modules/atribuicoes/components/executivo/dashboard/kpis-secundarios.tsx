import { Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { KpiCard } from "@/modules/atribuicoes/components/executivo/dashboard/kpi-card";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import type { KpisSecundarios } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface KpisSecundariosProps {
  kpis: KpisSecundarios;
  // "Vendendo 30d" lê o mesmo `miniStats` (SST, via `crossCanalPromise`)
  // já usado no "Venderam últimos 30d" do cabeçalho — antes reaproveitava
  // ExecutivoPerfil.vendendoUltimos30d/Pct (local/mock), o que fazia esse
  // card divergir do número real mostrado mais acima na mesma página
  // (pedido do usuário, 2026-08-24: replicar o dado real aqui). Fica no
  // seu próprio Suspense, sem atrasar "Mês anterior"/"Projeção fim do
  // mês" (que já vêm prontos de `heroKpisPromise`) — mesma promise já
  // disparada pro cabeçalho, sem custo adicional (ver
  // executivo-dashboard-view.tsx).
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

async function Vendendo30dKpiCard({
  crossCanalPromise,
}: Pick<KpisSecundariosProps, "crossCanalPromise">) {
  const { miniStats } = await crossCanalPromise;
  return (
    <KpiCard
      label="Vendendo 30d"
      tooltip="Agências com pelo menos uma venda nos últimos 30 dias."
      value={
        <span className="text-success inline-flex items-center gap-1.5">
          <TrendingUp className="size-4.5" />
          <SensitiveValue value={miniStats.vendendo30d} />
        </span>
      }
      subtext={<SensitiveValue value={`${miniStats.vendendo30dPct}%`} />}
    />
  );
}

function Vendendo30dKpiCardSkeleton() {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-6 w-16" />
      <Skeleton className="mt-1.5 h-3 w-10" />
    </div>
  );
}

// Linha de 3 cards de KPI secundários (SPEC 3.7) — os 3 são reais via
// SST: "Mês anterior" e "Projeção fim do mês" vêm de `heroKpisPromise`
// (projeção = ritmo do mês até hoje extrapolado pros dias restantes, ver
// construirHeroEKpis em executivo-dashboard.sst-service.ts); "Vendendo
// 30d" vem de `crossCanalPromise` (ver comentário da prop acima).
export function KpisSecundariosGrid({ kpis, crossCanalPromise }: KpisSecundariosProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-semibold">KPIs Secundários</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Mês anterior (realizado)"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.mesAnteriorValor)} />}
          subtext={
            <div className="flex flex-col gap-1">
              <span className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <span
                  className="bg-primary block h-full rounded-full"
                  style={{ width: `${Math.min(100, kpis.mesAnteriorPercentualAtingido)}%` }}
                />
              </span>
              <SensitiveValue
                value={`Falta ${formatarMoedaAbreviada(kpis.mesAnteriorFaltaValor)} (${kpis.mesAnteriorPercentualAtingido}% atingido)`}
              />
            </div>
          }
        />
        <KpiCard
          label="Projeção fim do mês"
          tooltip="Projeção linear com base no ritmo de vendas do mês corrente."
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.projecaoFimMes)} />}
          subtext="ritmo atual"
        />
        <Suspense fallback={<Vendendo30dKpiCardSkeleton />}>
          <Vendendo30dKpiCard crossCanalPromise={crossCanalPromise} />
        </Suspense>
      </div>
    </div>
  );
}

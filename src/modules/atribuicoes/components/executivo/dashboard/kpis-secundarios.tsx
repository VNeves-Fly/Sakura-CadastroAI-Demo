import { TrendingUp } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { KpiCard } from "@/modules/atribuicoes/components/executivo/dashboard/kpi-card";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { KpisSecundarios } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface KpisSecundariosProps {
  kpis: KpisSecundarios;
  // "Vendendo 30D" reaproveita os mesmos números do cabeçalho de perfil
  // (ExecutivoPerfil.vendendoUltimos30d/Pct, local-DB/mock) em vez do
  // `crossCanalPromise` (SST) — de propósito: essa seção só espera
  // `heroKpisPromise` (rápida), e puxar o número real aqui obrigaria a
  // esperar também o loop pesado de crossCanal, anulando o ganho de
  // performance do streaming em duas velocidades (ver
  // executivo-dashboard-view.tsx).
  vendendo30d: number;
  vendendo30dPct: number;
}

// Linha de 3 cards de KPI secundários (SPEC 3.7) — "Mês anterior" e
// "Projeção fim do mês" vêm de `heroKpisPromise`, ambos reais via SST
// (projeção = ritmo do mês até hoje extrapolado pros dias restantes, ver
// construirHeroEKpis em executivo-dashboard.sst-service.ts);
// "Vendendo 30d" é mock (ver comentário da prop acima).
export function KpisSecundariosGrid({ kpis, vendendo30d, vendendo30dPct }: KpisSecundariosProps) {
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
        <KpiCard
          label="Vendendo 30d"
          tooltip="Agências com pelo menos uma venda nos últimos 30 dias."
          value={
            <span className="text-success inline-flex items-center gap-1.5">
              <TrendingUp className="size-4.5" />
              <SensitiveValue value={vendendo30d} />
            </span>
          }
          subtext={<SensitiveValue value={`${vendendo30dPct}%`} />}
          mock
        />
      </div>
    </div>
  );
}

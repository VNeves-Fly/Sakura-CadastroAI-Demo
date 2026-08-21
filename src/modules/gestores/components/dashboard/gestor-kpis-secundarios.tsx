import { TrendingUp } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { GestorKpiCard } from "@/modules/gestores/components/dashboard/gestor-kpi-card";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type { KpisSecundariosGestor } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorKpisSecundariosProps {
  kpis: KpisSecundariosGestor;
}

// Linha de 3 cards de KPI secundários (SPEC 3.8) — mesmo layout do
// dashboard de Executivo: Mês anterior, Projeção fim do mês e Vendendo
// 30d (esse último reaproveita os mesmos números do cabeçalho de perfil,
// GestorPerfil.vendendoUltimos30d/Pct).
export function GestorKpisSecundariosGrid({ kpis }: GestorKpisSecundariosProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold">KPIs Secundários</h3>
        <MockBadge />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GestorKpiCard
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
        <GestorKpiCard
          label="Projeção fim do mês"
          tooltip="Projeção linear com base no ritmo de vendas do mês corrente."
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.projecaoFimMes)} />}
          subtext="ritmo atual"
        />
        <GestorKpiCard
          label="Vendendo 30d"
          tooltip="Agências com pelo menos uma venda nos últimos 30 dias."
          value={
            <span className="text-success inline-flex items-center gap-1.5">
              <TrendingUp className="size-4.5" />
              <SensitiveValue value={kpis.vendendo30d} />
            </span>
          }
          subtext={<SensitiveValue value={`${kpis.vendendo30dPct}%`} />}
        />
      </div>
    </div>
  );
}

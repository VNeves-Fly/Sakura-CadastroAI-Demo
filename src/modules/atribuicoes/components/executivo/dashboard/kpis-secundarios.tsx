import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { KpiCard } from "@/modules/atribuicoes/components/executivo/dashboard/kpi-card";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { KpisSecundarios } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface KpisSecundariosProps {
  kpis: KpisSecundarios;
}

// Linha de 4 cards de KPI secundários (SPEC 4.2) — todos os valores são
// mock (mesAnteriorValor, projecaoFimMes, acumuladoAnoValor, ticketMedio30d
// derivados de hash do promotor ID).
export function KpisSecundariosGrid({ kpis }: KpisSecundariosProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold">KPIs Secundários</h3>
        <MockBadge />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          label="Acumulado ano"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.acumuladoAnoValor)} />}
          subtext={<SensitiveValue value={`${kpis.acumuladoAnoBilhetes} bilhetes`} />}
        />
        <KpiCard
          label="Ticket médio (30d)"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.ticketMedio30d)} />}
          subtext="média por bilhete"
        />
      </div>
    </div>
  );
}

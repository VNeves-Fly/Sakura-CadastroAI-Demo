import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { GestorKpiCard } from "@/modules/gestores/components/dashboard/gestor-kpi-card";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import type { KpisSecundariosGestor } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorKpisSecundariosProps {
  kpis: KpisSecundariosGestor;
}

// Linha de 4 cards de KPI secundários — Mês anterior (realizado), Projeção
// fim do mês, Acumulado ano, Ticket médio (30d). Todos os valores são mock
// (derivados de hash do gestor ID). Mesmo layout do dashboard de Executivo.
export function GestorKpisSecundariosGrid({ kpis }: GestorKpisSecundariosProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold">KPIs Secundários</h3>
        <MockBadge />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GestorKpiCard
          label="Mês anterior (realizado)"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.mesAnteriorValor)} />}
          subtext={`fechamento ${kpis.mesAnteriorMesReferencia}`}
        />
        <GestorKpiCard
          label="Projeção fim do mês"
          tooltip="Projeção linear com base no ritmo de vendas do mês corrente."
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.projecaoFimMes)} />}
          subtext="no ritmo atual"
        />
        <GestorKpiCard
          label="Acumulado ano"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.acumuladoAnoValor)} />}
          subtext={<SensitiveValue value={`${kpis.acumuladoAnoBilhetes} bilhetes`} />}
        />
        <GestorKpiCard
          label="Ticket médio (30d)"
          value={<SensitiveValue value={formatarMoedaAbreviada(kpis.ticketMedio30d)} />}
          subtext="média por bilhete"
        />
      </div>
    </div>
  );
}

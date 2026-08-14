import { Building2, TrendingUp, AlertTriangle, Wallet } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { KpiCard } from "@/modules/atribuicoes/components/executivo/dashboard/kpi-card";
import type { MiniStats as MiniStatsType } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface MiniStatsProps {
  miniStats: MiniStatsType;
}

// Linha de 4 mini-cards estatísticos (SPEC 4.3).
export function MiniStatsGrid({ miniStats }: MiniStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <KpiCard
        compact
        label="Agências"
        tooltip="Total de agências aprovadas na carteira."
        value={
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="text-muted-foreground size-4" />
            <SensitiveValue value={miniStats.agencias} />
          </span>
        }
      />
      <KpiCard
        compact
        label="Vendendo 30d"
        tooltip="Agências com pelo menos uma venda nos últimos 30 dias."
        value={
          <span className="text-success inline-flex items-center gap-1.5">
            <TrendingUp className="size-4" />
            <SensitiveValue value={miniStats.vendendo30d} />
          </span>
        }
        subtext={<SensitiveValue value={`${miniStats.vendendo30dPct}%`} />}
      />
      <KpiCard
        compact
        label="Ociosas (limite)"
        tooltip="Agências com limite de crédito parado, sem uso recente."
        value={
          <span className="text-warning inline-flex items-center gap-1.5">
            <AlertTriangle className="size-4" />
            <SensitiveValue value={miniStats.ociosasLimite} />
          </span>
        }
      />
      <KpiCard
        compact
        label="Com crédito"
        tooltip="Agências com limite de crédito ativo hoje."
        value={
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="text-muted-foreground size-4" />
            <SensitiveValue value={miniStats.comCredito} />
          </span>
        }
      />
    </div>
  );
}

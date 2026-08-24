import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { cn } from "@/lib/utils";

interface GestorKpiCardProps {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  tooltip?: string;
  valueClassName?: string;
  compact?: boolean;
  mock?: boolean;
}

// KpiCard genérico do dashboard de Gestor — mesmo visual de
// executivo/dashboard/kpi-card.tsx (duplicado por isolamento entre
// módulos, ver princípio já documentado em outros utils/componentes deste
// projeto). `mock` marca só este card como mock, mesma convenção do
// Executivo — não a seção inteira (ver gestor-kpis-secundarios.tsx).
export function GestorKpiCard({
  label,
  value,
  subtext,
  tooltip,
  valueClassName,
  compact,
  mock,
}: GestorKpiCardProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase">
        {label}
        {mock ? <MockBadge /> : null}
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3" />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : null}
      </p>
      <p
        className={cn(
          "text-foreground mt-1 font-bold",
          compact ? "text-xl" : "text-2xl",
          valueClassName,
        )}
      >
        {value}
      </p>
      {subtext ? <div className="text-muted-foreground mt-1 text-xs">{subtext}</div> : null}
    </div>
  );
}

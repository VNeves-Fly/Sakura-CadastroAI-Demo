import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  tooltip?: string;
  valueClassName?: string;
  compact?: boolean;
  mock?: boolean;
}

// KpiCard / StatMiniCard genérico (inventário SPEC seção 10) — label
// uppercase + valor grande + subtexto opcional + ⓘ opcional. Usado tanto
// na linha de 4 KPIs secundários quanto na de 4 mini-stats (só muda o
// tamanho via `compact`). `mock` marca só este card como mock — usado
// pelos cards individuais que ainda não têm fonte real (ver
// kpis-secundarios.tsx/mini-stats.tsx), não pela seção inteira.
export function KpiCard({
  label,
  value,
  subtext,
  tooltip,
  valueClassName,
  compact,
  mock,
}: KpiCardProps) {
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

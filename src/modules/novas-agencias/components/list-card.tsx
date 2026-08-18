import type { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ListCardItem {
  label: string;
  valor: string;
  tooltip?: string;
}

interface ListCardProps {
  icon: LucideIcon;
  titulo: string;
  itens: ListCardItem[];
  totalLabel?: string;
  totalValor?: string;
  comDivisorAntesDoTotal?: boolean;
}

// Card de lista rótulo/valor (SPEC 7.2/7.3) — "Mix de pagamento" e
// "Crédito". Rótulos com `tooltip` ganham sublinhado pontilhado
// (indica que há mais detalhe ao passar o mouse).
export function ListCard({
  icon: Icon,
  titulo,
  itens,
  totalLabel,
  totalValor,
  comDivisorAntesDoTotal = false,
}: ListCardProps) {
  return (
    <div className="border-border bg-card flex h-full flex-col rounded-xl border p-4 shadow-sm">
      <div className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-medium">
        <Icon className="size-3.5" />
        <span>{titulo}</span>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {itens.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            {item.tooltip ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="text-muted-foreground min-w-0 cursor-help border-b border-dotted border-current/40" />
                  }
                >
                  {item.label}
                </TooltipTrigger>
                <TooltipContent>{item.tooltip}</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground min-w-0">{item.label}</span>
            )}
            <span className="shrink-0 font-medium whitespace-nowrap">{item.valor}</span>
          </div>
        ))}
      </div>

      {totalLabel ? (
        <div
          className={cn(
            "mt-2 flex items-center justify-between gap-3 text-sm",
            comDivisorAntesDoTotal && "border-border border-t pt-2",
          )}
        >
          <span className="text-muted-foreground min-w-0">{totalLabel}</span>
          <span className="shrink-0 font-semibold whitespace-nowrap">{totalValor}</span>
        </div>
      ) : null}
    </div>
  );
}

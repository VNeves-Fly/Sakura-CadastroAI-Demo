import type { LucideIcon } from "lucide-react";
import {
  formatarMoedaComDecimalPequeno,
  formatarPercentual,
} from "@/modules/tv/utils/formatar.util";

interface TvVendasCardProps {
  icon: LucideIcon;
  label: string;
  valorTotal: number;
  margemPct: number;
}

// Cards "Vendas Hoje / Vendas no Mês / Vendas no Ano" — 3 períodos
// fixos lado a lado, sem toggle (spec seção 6). Borda/sombra rosa
// suave própria, diferente dos demais cards da página (border-border
// simples) — mesmo destaque visual do spec original.
export function TvVendasCard({ icon: Icon, label, valorTotal, margemPct }: TvVendasCardProps) {
  const { principal, decimal } = formatarMoedaComDecimalPequeno(valorTotal);

  return (
    <div className="border-primary/15 bg-card relative min-w-0 overflow-hidden rounded-xl border p-3 shadow-[0_4px_14px_-8px_rgba(246,15,158,0.25)] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-primary flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold tracking-widest uppercase">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <div className="border-border bg-muted min-w-[4.8rem] shrink-0 rounded-md border px-2.5 py-1.5 text-right">
          <div className="text-muted-foreground text-[0.65rem] font-semibold tracking-wider whitespace-nowrap uppercase">
            Margem
          </div>
          <div className="text-foreground text-base font-bold whitespace-nowrap tabular-nums">
            {formatarPercentual(margemPct)}
          </div>
        </div>
      </div>

      <div className="text-foreground mt-1.5 leading-none">
        <span
          className="inline-block min-w-0 font-bold break-words tabular-nums"
          style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}
        >
          {principal}
          <span className="text-muted-foreground ml-[0.12em] align-top text-[0.42em] font-semibold tracking-tight">
            {decimal}
          </span>
        </span>
      </div>
    </div>
  );
}

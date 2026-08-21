import type { LucideIcon } from "lucide-react";
import {
  formatarMoedaAbreviada,
  formatarMoedaComDecimalPequeno,
  formatarNumero,
  formatarPercentual,
} from "@/modules/tv/utils/formatar.util";
import type { CanalTv } from "@/modules/tv/types/tv.types";

const COR_INTL = "#7c3aed";

interface TvCanalCardProps {
  icon: LucideIcon;
  label: string;
  dados: CanalTv;
}

// Cards "Aéreo" e "Terrestre" — mesmo componente, só troca ícone/label
// (spec seção 7.1). Segue o período selecionado na store da página
// (ver tv-view.tsx) — não tem mais toggle próprio.
export function TvCanalCard({ icon: Icon, label, dados }: TvCanalCardProps) {
  const { principal, decimal } = formatarMoedaComDecimalPequeno(dados.valorTotal);

  return (
    <div className="border-border bg-card flex min-w-0 flex-col gap-2 rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-lg p-2">
          <Icon className="size-4 text-white sm:size-5" />
        </span>
        <span className="text-primary min-w-0 flex-1 truncate text-base font-bold sm:text-xl">
          {label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-foreground inline-block font-bold break-words tabular-nums">
          <span className="text-[1.35rem] sm:text-[1.65rem]">{principal}</span>
          <span className="text-muted-foreground ml-[0.12em] align-top text-[0.55em] font-semibold tracking-tight">
            {decimal}
          </span>
        </span>

        <div className="flex min-w-0 flex-row gap-1.5">
          <TvMiniStat label="Bilhetes" valor={formatarNumero(dados.bilhetes)} />
          <TvMiniStat label="Agências" valor={formatarNumero(dados.agencias)} />
          <TvMiniStat label="Ticket médio" valor={formatarMoedaAbreviada(dados.ticketMedio)} />
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-muted-foreground mb-1 flex items-center justify-between text-[0.7rem] font-semibold tracking-wider uppercase sm:text-xs">
          <span>NAC {formatarPercentual(dados.nacPct)}</span>
          <span className="text-foreground tabular-nums">
            INTL {formatarPercentual(dados.intlPct)}
          </span>
        </div>
        <div className="bg-muted flex h-1.5 w-full overflow-hidden rounded-full sm:h-2">
          <div style={{ width: `${dados.nacPct}%`, backgroundColor: "#f60f9e" }} />
          <div style={{ width: `${dados.intlPct}%`, backgroundColor: COR_INTL }} />
        </div>
      </div>
    </div>
  );
}

function TvMiniStat({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="border-border bg-muted min-w-0 flex-1 rounded-lg border px-2 py-1.5">
      <div className="text-muted-foreground truncate text-[0.65rem] font-semibold tracking-wider uppercase">
        {label}
      </div>
      <div className="text-foreground truncate text-sm font-bold tabular-nums">{valor}</div>
    </div>
  );
}

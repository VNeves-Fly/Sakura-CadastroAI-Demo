import { Trophy } from "lucide-react";
import { formatarMoedaBrl, formatarPercentual } from "@/modules/tv/utils/formatar.util";
import type { PeriodoTv, Top10LinhaTv } from "@/modules/tv/types/tv.types";

const LABEL_PERIODO: Record<PeriodoTv, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

interface TvTop10CardProps {
  titulo: string;
  escopoLabel: string;
  periodo: PeriodoTv;
  linhas: Top10LinhaTv[];
}

// Cards "Top 10 Clientes/Nacional/Internacional" — mesmo componente,
// muda só título/subtítulo/dados (spec seção 8). Segue o período único
// da página (ver tv-view.tsx).
export function TvTop10Card({ titulo, escopoLabel, periodo, linhas }: TvTop10CardProps) {
  return (
    <div className="border-border bg-card flex min-w-0 flex-col rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-md p-1.5">
          <Trophy className="size-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-base font-bold">{titulo}</div>
          <div className="text-muted-foreground truncate text-[0.7rem] font-semibold tracking-wider uppercase">
            {LABEL_PERIODO[periodo]} · {escopoLabel}
          </div>
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {linhas.map((linha) => (
          <li
            key={linha.posicao}
            className="border-border bg-card rounded-md border px-2 py-1 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-6 shrink-0 text-right font-semibold tabular-nums">
                {linha.posicao}
              </span>
              <span className="text-foreground min-w-0 flex-1 truncate font-semibold">
                {linha.nome}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pl-8 text-sm">
              <span className="text-foreground font-bold whitespace-nowrap tabular-nums">
                {formatarMoedaBrl(linha.valor)}
              </span>
              <span className="text-primary font-semibold whitespace-nowrap tabular-nums">
                {formatarPercentual(linha.margemPct)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

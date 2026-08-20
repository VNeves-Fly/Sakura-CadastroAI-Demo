import { Plane } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarMoedaBrl, formatarPercentual } from "@/modules/tv/utils/formatar.util";
import type { CompanhiaShareTv, PeriodoTv } from "@/modules/tv/types/tv.types";

const LABEL_PERIODO: Record<PeriodoTv, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  mes: "Mês",
  ano: "Ano",
};

interface TvShareAereoCardProps {
  periodo: PeriodoTv;
  companhias: CompanhiaShareTv[];
}

// Share entre companhias aéreas (Azul/Gol/Latam), sempre sobre o aéreo
// nacional (spec seção 7.2). Cada linha tem tooltip com o valor absoluto
// e "% do nacional" ao passar o mouse.
export function TvShareAereoCard({ periodo, companhias }: TvShareAereoCardProps) {
  return (
    <div className="border-border bg-card flex min-w-0 flex-col gap-3 rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-lg p-2">
          <Plane className="size-4 text-white sm:size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-primary truncate text-base font-bold sm:text-xl">Share Aéreo</div>
          <div className="text-muted-foreground text-[0.7rem] font-semibold tracking-wider uppercase">
            {LABEL_PERIODO[periodo]} · Nacional
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2">
        {companhias.map((companhia) => (
          <Tooltip key={companhia.nome}>
            <TooltipTrigger
              render={
                <div className="min-w-0 cursor-pointer">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: companhia.corHex }}
                      />
                      <span className="text-foreground truncate text-sm font-semibold tracking-wide uppercase">
                        {companhia.nome}
                      </span>
                    </div>
                    <span className="text-foreground shrink-0 text-sm font-semibold tabular-nums">
                      {formatarPercentual(companhia.pct)}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full sm:h-2">
                    <div
                      className="h-full"
                      style={{ width: `${companhia.pct}%`, backgroundColor: companhia.corHex }}
                    />
                  </div>
                </div>
              }
            />
            <TooltipContent side="top">
              {/* TooltipContent já é bg-foreground/text-background (escuro
                  com texto claro) — variação de ênfase aqui é por opacity,
                  não cor fixa, pra continuar coerente em qualquer tema. */}
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="text-[0.65rem] tracking-wider uppercase opacity-60">
                  {companhia.nome}
                </span>
                <span className="font-bold">{formatarMoedaBrl(companhia.valorAbsoluto)}</span>
                <span className="text-[0.7rem] opacity-70">
                  {formatarPercentual(companhia.pct)} do nacional
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

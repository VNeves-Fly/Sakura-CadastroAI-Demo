import type { LucideIcon } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import type { RankingAgenciaHoje } from "@/modules/atribuicoes/utils/canal-resumo-mock.util";

interface TopAgenciasExecutivoCardProps {
  icon: LucideIcon;
  titulo: string;
  subtitulo: string;
  itens: RankingAgenciaHoje[];
  iconLinhaTema: "rosa" | "azul";
}

// Ranking "Top 10 Agências" (SPEC 3.8) — 3 instâncias na tela (Hoje/Aéreo/
// Terrestre). Mock de apresentação (ver canal-resumo-mock.util.ts) — o
// nome da agência é real, valor/quantidade não têm fonte no SST hoje.
export function TopAgenciasExecutivoCard({
  icon: Icon,
  titulo,
  subtitulo,
  itens,
  iconLinhaTema,
}: TopAgenciasExecutivoCardProps) {
  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border p-4.5">
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn(
            "mt-0.5 size-4.5 shrink-0",
            iconLinhaTema === "rosa" ? "text-primary" : "text-info",
          )}
        />
        <div>
          <h3 className="text-foreground text-[15px] font-bold">{titulo}</h3>
          <p className="text-muted-foreground text-xs">{subtitulo}</p>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma agência com venda hoje.</p>
      ) : (
        <ul className="divide-border mt-1 flex flex-col divide-y">
          {itens.map((item) => (
            <li key={`${item.posicao}-${item.nome}`} className="flex items-center gap-2.5 py-1.75">
              <span className="text-muted-foreground w-4 shrink-0 text-right text-[13px] font-bold">
                {item.posicao}
              </span>
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  iconLinhaTema === "rosa" ? "text-primary/70" : "text-info/70",
                )}
              />
              <span className="text-foreground min-w-0 flex-1 truncate text-[13px] font-semibold">
                {item.nome}
              </span>
              <span className="shrink-0 text-right">
                <span className="text-foreground block text-[13.5px] font-bold">
                  <SensitiveValue value={formatarMoedaAbreviada(item.valor)} />
                </span>
                <span className="text-muted-foreground block text-xs">
                  <SensitiveValue value={item.quantidade} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

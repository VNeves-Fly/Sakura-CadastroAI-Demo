import { Trophy } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { RankingAgencia } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface TopAgenciasCardProps {
  titulo: string;
  ranking: RankingAgencia[];
}

// TopRankingList (SPEC 4.9) — lista numerada, nome à esquerda, valor à
// direita.
export function TopAgenciasCard({ titulo, ranking }: TopAgenciasCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
        <Trophy className="text-warning size-4" />
        {titulo}
      </h3>

      {ranking.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma agência com venda no período.</p>
      ) : (
        <ol className="divide-border mt-3 flex flex-col divide-y">
          {ranking.map((item) => (
            <li
              key={`${item.posicao}-${item.nome}`}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="text-foreground truncate">
                <span className="text-muted-foreground mr-2 tabular-nums">{item.posicao}º</span>
                {item.nome}
              </span>
              <span className="text-foreground shrink-0 font-medium tabular-nums">
                <SensitiveValue value={formatarMoedaAbreviada(item.valor)} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

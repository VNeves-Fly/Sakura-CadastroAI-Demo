import type { LucideIcon } from "lucide-react";
import { formatarMoedaAbreviada } from "@/modules/gestores/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";
import type { RankingAgencia } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorTopAgenciasCardProps {
  icon: LucideIcon;
  titulo: string;
  subtitulo: string;
  itens: RankingAgencia[];
  iconLinhaTema: "rosa" | "azul";
}

// Ranking "Top 10 Agências" (SPEC 3.9) — 3 instâncias na tela (Hoje/Aéreo/
// Terrestre), mesmo componente/lógica de TopAgenciasExecutivoCard do
// dashboard de Executivo (duplicado por isolamento de módulo).
export function GestorTopAgenciasCard({
  icon: Icon,
  titulo,
  subtitulo,
  itens,
  iconLinhaTema,
}: GestorTopAgenciasCardProps) {
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
                  {formatarMoedaAbreviada(item.valor)}
                </span>
                {item.quantidade !== undefined ? (
                  <span className="text-muted-foreground block text-xs">
                    {item.quantidade} bilhetes
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

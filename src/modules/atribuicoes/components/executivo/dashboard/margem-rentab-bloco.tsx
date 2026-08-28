import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/atribuicoes/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";

interface MargemRentabBlocoProps {
  margemLabel: string; // "MARGEM TOTAL" (receita total) ou "MARGEM" (canal)
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYValor: number;
  rentabLYVariacaoPct: number;
  tamanho?: "grande" | "pequeno";
}

// Bloco "MARGEM.../RENTAB. LY" do card de receita total e dos cartões de
// canal (Aéreo/Terrestre) — dois segmentos lado a lado, cada um com sua
// própria divisória e 2 linhas internas (rótulo+valor em cima, LY/seta
// embaixo), em vez de uma única divisória com as duas linhas empilhadas
// (pedido do usuário, 2026-08-21, print de referência). Compartilhado
// entre receita-total-card.tsx e canal-resumo-card.tsx pra não duplicar
// esse bloco duas vezes dentro do mesmo módulo.
export function MargemRentabBloco({
  margemLabel,
  margemPct,
  margemLYPct,
  margemVariacaoPct,
  rentabLYValor,
  rentabLYVariacaoPct,
  tamanho = "grande",
}: MargemRentabBlocoProps) {
  const margemNegativa = margemVariacaoPct < 0;
  const grande = tamanho === "grande";

  return (
    // `flex-wrap`: em telas estreitas (card de canal no mobile) os dois
    // segmentos não cabem lado a lado — sem isto o bloco vazava pra fora
    // do card (pedido do usuário, 2026-08-28, mesmo fix aplicado ao
    // dashboard-vendas). O segmento RENTAB. LY quebra pra uma segunda
    // linha em vez de estourar a largura do card.
    <div
      className={cn(
        "flex flex-wrap items-start",
        grande ? "gap-x-4 gap-y-2" : "gap-x-3.5 gap-y-1.5",
      )}
    >
      <div
        className={cn(
          "border-border flex flex-col gap-0.5 border-l",
          grande ? "pl-4 text-[12.5px]" : "pl-3.5 text-[11.5px]",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70 font-bold tracking-wide">{margemLabel}</span>
          <span className="text-foreground/80 font-bold">{formatarPercentual(margemPct)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">LY {formatarPercentual(margemLYPct)}</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-bold",
              margemNegativa ? "text-destructive" : "text-success",
            )}
          >
            {margemNegativa ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <ArrowUpRight className="size-3" />
            )}
            {formatarPercentual(Math.abs(margemVariacaoPct))}
          </span>
        </span>
      </div>

      <div
        className={cn(
          "border-border flex flex-col gap-0.5 border-l",
          grande ? "pl-4 text-[12.5px]" : "pl-3.5 text-[11.5px]",
        )}
      >
        <span className="text-muted-foreground/70 font-bold tracking-wide">RENTAB. LY ·</span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-semibold">
            <SensitiveValue value={formatarMoedaCompleta(rentabLYValor)} />
          </span>
          <span className="text-success inline-flex items-center gap-0.5 font-bold">
            <ArrowUpRight className="size-3" />
            {formatarPercentual(rentabLYVariacaoPct)}
          </span>
        </span>
      </div>
    </div>
  );
}

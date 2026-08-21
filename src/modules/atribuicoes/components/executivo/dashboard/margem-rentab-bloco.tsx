import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
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
  // Mostra "MK" ao lado do rótulo — usado no dashboard do Executivo, onde
  // o valor principal do card (hero) já é real via SST mas margem/rentab.
  // por canal continuam mock (ver canal-resumo-mock.util.ts); o card
  // inteiro não pode levar um MockBadge genérico sem misrepresentar o
  // valor real. Gestor não usa essa prop — lá o card inteiro ainda é mock.
  mock?: boolean;
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
  mock,
}: MargemRentabBlocoProps) {
  const margemNegativa = margemVariacaoPct < 0;
  const grande = tamanho === "grande";

  return (
    <div className={cn("flex items-center", grande ? "gap-4" : "gap-3.5")}>
      <div
        className={cn(
          "border-border flex flex-col gap-0.5 border-l",
          grande ? "pl-4 text-[12.5px]" : "pl-3.5 text-[11.5px]",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground/70 font-bold tracking-wide">{margemLabel}</span>
          {mock ? <MockBadge /> : null}
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

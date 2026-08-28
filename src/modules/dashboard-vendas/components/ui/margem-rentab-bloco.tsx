import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatarMoedaBrl,
  formatarPercentual,
} from "@/modules/dashboard-vendas/utils/formatar-moeda.util";

interface MargemRentabBlocoProps {
  margemLabel: string; // "MARGEM TOTAL" (resumo do dia) ou "MARGEM" (canal)
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYValor: number;
  rentabLYVariacaoPct: number;
  tamanho?: "grande" | "pequeno";
}

// Bloco "MARGEM.../RENTAB. LY" — mesmo componente (mesmo markup/classes) do
// dashboard do Executivo (ver margem-rentab-bloco.tsx em
// atribuicoes/components/executivo/dashboard), duplicado aqui em vez de
// importado entre módulos (pedido do usuário, 2026-08-28: layout idêntico
// nos dois dashboards) — mesmo padrão de isolamento entre módulos já usado
// pelo resto do projeto (ex.: agencia-margem-rentab-bloco.tsx em
// agencias-crm, margem-rentab-bloco.tsx em gestores).
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
    <div className={cn("flex items-center", grande ? "gap-4" : "gap-3.5")}>
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
            {formatarMoedaBrl(rentabLYValor)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-bold",
              rentabLYVariacaoPct < 0 ? "text-destructive" : "text-success",
            )}
          >
            {rentabLYVariacaoPct < 0 ? (
              <ArrowDownRight className="size-3" />
            ) : (
              <ArrowUpRight className="size-3" />
            )}
            {formatarPercentual(Math.abs(rentabLYVariacaoPct))}
          </span>
        </span>
      </div>
    </div>
  );
}

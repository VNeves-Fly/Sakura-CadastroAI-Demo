import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  formatarMoedaCompleta,
  formatarPercentual,
} from "@/modules/agencias-crm/utils/formatar-moeda.util";
import { cn } from "@/lib/utils";

interface AgenciaMargemRentabBlocoProps {
  margemLabel: string; // "MARGEM TOTAL" (volume total) ou "MARGEM" (canal)
  margemPct: number;
  margemLYPct: number;
  margemVariacaoPct: number;
  rentabLYValor: number;
  rentabLYVariacaoPct: number;
  tamanho?: "grande" | "pequeno";
}

// Bloco "MARGEM.../RENTAB. LY" do card "Volume total" e dos sub-cards de
// canal (Aéreo/Terrestre) — real via SST (GET /api/consolidado/air|non-air,
// ver agencia-detalhe.adapter.ts) quando a agência tem venda detectada;
// mock por hash como fallback, mesmo critério do resto do módulo. Mesmo
// padrão visual do MargemRentabBloco já usado em Executivo/Gestor
// (duplicado por isolamento de módulo).
export function AgenciaMargemRentabBloco({
  margemLabel,
  margemPct,
  margemLYPct,
  margemVariacaoPct,
  rentabLYValor,
  rentabLYVariacaoPct,
  tamanho = "grande",
}: AgenciaMargemRentabBlocoProps) {
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
            {formatarMoedaCompleta(rentabLYValor)}
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

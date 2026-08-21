import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
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
  // Mostra "MK" ao lado do rótulo — margem/rentabilidade não têm fonte
  // real hoje (ver canal-margem-mock.util.ts) mesmo quando o valor
  // principal do card ao redor (volume, ticket médio) já é real via SST;
  // por isso o badge fica neste bloco, não no card inteiro (mesmo padrão
  // de MargemRentabBloco do módulo Executivo).
  mock?: boolean;
}

// Bloco "MARGEM.../RENTAB. LY" do card "Volume total" e dos sub-cards de
// canal (Aéreo/Terrestre) — mesmo padrão visual do MargemRentabBloco já
// usado em Executivo/Gestor (duplicado por isolamento de módulo).
export function AgenciaMargemRentabBloco({
  margemLabel,
  margemPct,
  margemLYPct,
  margemVariacaoPct,
  rentabLYValor,
  rentabLYVariacaoPct,
  tamanho = "grande",
  mock,
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

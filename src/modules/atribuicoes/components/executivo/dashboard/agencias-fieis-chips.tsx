import { Heart } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import type { LoyaltyChip } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface AgenciasFieisChipsProps {
  chips: LoyaltyChip[];
  ano: number;
}

// LoyaltyChipList (SPEC 4.4) — lista horizontal (wrap) de chips, coração
// azul só na companhia líder (#1), rosa nas demais.
export function AgenciasFieisChips({ chips, ano }: AgenciasFieisChipsProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <h3 className="text-foreground text-sm font-semibold">
        Agências fiéis por companhia — {ano}
      </h3>
      {chips.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Sem dados de fidelidade ainda.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip.companhia}
              className="border-border bg-muted/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            >
              <Heart
                className={
                  chip.destaque
                    ? "size-3 fill-current text-[hsl(var(--chart-2))]"
                    : "text-primary size-3 fill-current"
                }
              />
              <SensitiveValue value={chip.quantidade} />
              <span className="text-muted-foreground">{chip.companhia}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

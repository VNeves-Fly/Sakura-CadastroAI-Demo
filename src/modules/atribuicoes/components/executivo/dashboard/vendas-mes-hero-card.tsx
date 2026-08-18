import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaCompleta } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { VendasMesHero } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface VendasMesHeroCardProps {
  hero: VendasMesHero;
}

// Card hero (SPEC 4.1) — maior número da página, fundo com gradiente
// sutil branco→rosa claríssimo. Todos os dados são mock (valor, bilhetes,
// agenciasVendendo, variacaoPct derivados de hash do promotor ID).
export function VendasMesHeroCard({ hero }: VendasMesHeroCardProps) {
  const negativo = hero.variacaoPct < 0;

  return (
    <div className="border-border from-card to-accent/40 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6">
      <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
        <MockBadge />
        <span
          className={
            negativo
              ? "text-destructive inline-flex items-center gap-1 text-sm font-semibold"
              : "text-success inline-flex items-center gap-1 text-sm font-semibold"
          }
        >
          {negativo ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
          <SensitiveValue value={`${Math.abs(hero.variacaoPct).toFixed(1)}%`} />
        </span>
        <span className="text-muted-foreground text-[11px]">vs mesmo dia do mês anterior</span>
      </div>

      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        Vendas do mês atual (apurado)
      </p>
      <p className="text-foreground mt-1 text-4xl font-bold tracking-tight">
        <SensitiveValue value={formatarMoedaCompleta(hero.valor)} />
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        <SensitiveValue value={hero.bilhetes} /> bilhetes ·{" "}
        <SensitiveValue value={hero.agenciasVendendo} /> agências vendendo
      </p>
    </div>
  );
}

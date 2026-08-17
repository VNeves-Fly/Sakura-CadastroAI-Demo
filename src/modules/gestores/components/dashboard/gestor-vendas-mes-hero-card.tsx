import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import {
  formatarMoedaAbreviada,
  formatarMoedaCompleta,
} from "@/modules/gestores/utils/formatar-moeda.util";
import type { VendasMesHeroGestor } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorVendasMesHeroCardProps {
  hero: VendasMesHeroGestor;
}

// Banner "Vendas do mês atual — gestão completa" (SPEC pedida pelo
// usuário, 2026-08-17) — mesmo gradiente sutil do hero de Executivo, com
// um bloco extra de meta do mês (barra de progresso rosa→roxo, mesmo
// gradiente do BotaoNovoCadastro) que o card de Executivo não tem.
export function GestorVendasMesHeroCard({ hero }: GestorVendasMesHeroCardProps) {
  const negativo = hero.variacaoPct < 0;

  return (
    <div className="border-border from-card to-accent/40 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-[260px] flex-1">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Vendas do mês atual — gestão completa
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <p className="text-foreground text-4xl font-bold tracking-tight">
              <SensitiveValue value={formatarMoedaCompleta(hero.valor)} />
            </p>
            <span
              className={
                negativo
                  ? "text-destructive inline-flex items-center gap-1 text-sm font-semibold"
                  : "text-success inline-flex items-center gap-1 text-sm font-semibold"
              }
            >
              {negativo ? (
                <ArrowDownRight className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
              <SensitiveValue value={`${Math.abs(hero.variacaoPct).toFixed(1)}%`} />
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            <SensitiveValue value={hero.bilhetes} /> bilhetes ·{" "}
            <SensitiveValue value={hero.agenciasVendendo} /> agências vendendo ·{" "}
            <SensitiveValue value={hero.executivosAtivos} /> executivos · vs. mesmo dia do mês
            anterior
          </p>
        </div>

        <div className="w-full max-w-xs shrink-0 sm:w-72">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <p className="text-muted-foreground">
              Meta do mês ·{" "}
              <span className="text-foreground font-semibold">
                <SensitiveValue value={formatarMoedaAbreviada(hero.meta.valor)} />
              </span>
            </p>
            <p className="text-foreground font-semibold">
              {hero.meta.percentualAtingido}% atingido
            </p>
          </div>
          <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
            <span
              className="from-pink-glow to-violet-glow block h-full rounded-full bg-gradient-to-r"
              style={{ width: `${Math.min(100, hero.meta.percentualAtingido)}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 text-xs">
            Falta <SensitiveValue value={formatarMoedaAbreviada(hero.meta.faltaValor)} /> · projeção
            fim do mês <SensitiveValue value={formatarMoedaAbreviada(hero.meta.projecaoFimMes)} />{" "}
            no ritmo atual
          </p>
        </div>
      </div>
    </div>
  );
}

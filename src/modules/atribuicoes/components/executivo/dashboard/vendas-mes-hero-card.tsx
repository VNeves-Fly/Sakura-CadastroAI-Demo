"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { MockBadge } from "@/modules/shared/components/mock-badge";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { PeriodToggle } from "@/modules/dashboard-vendas/components/ui/period-toggle";
import { PersonalizadoDateRange } from "@/modules/dashboard-vendas/components/ui/personalizado-date-range";
import { PersonalizadoAviso } from "@/modules/dashboard-vendas/components/ui/personalizado-aviso";
import { formatarMoedaCompleta } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type {
  PeriodoVendasMesHero,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface VendasMesHeroCardProps {
  hero: Record<PeriodoVendasMesHero, VendasMesHero>;
}

// "Personalizado" é só de UI por enquanto — mesma decisão de
// resumo-do-dia-card.tsx (não existe cálculo real por intervalo arbitrário
// de datas, exigiria consulta nova no back-end). Mostra a prévia de "Mês"
// com o aviso de PersonalizadoAviso deixando isso explícito.
type FiltroHero = PeriodoVendasMesHero | "personalizado";
const PERIODO_PREVIA_PERSONALIZADO: PeriodoVendasMesHero = "mes";

const OPCOES_PERIODO: { valor: FiltroHero; label: string }[] = [
  { valor: "dia", label: "Dia" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
  { valor: "personalizado", label: "Personalizado" },
];

const TITULO_POR_PERIODO: Record<PeriodoVendasMesHero, string> = {
  dia: "Vendas de hoje (apurado)",
  ontem: "Vendas de ontem (apurado)",
  mes: "Vendas do mês atual (apurado)",
  ano: "Vendas do ano atual (apurado)",
};

// Card hero (SPEC 4.1) — maior número da página, fundo com gradiente
// sutil branco→rosa claríssimo, com filtro Dia/Ontem/Mês/Ano/Personalizado
// (reaproveita o PeriodToggle + PersonalizadoDateRange/Aviso já usados no
// dashboard-vendas, ver resumo-do-dia-card.tsx). Todos os dados são mock
// (valor, bilhetes, agenciasVendendo, variacaoPct derivados de hash do
// promotor ID — um conjunto por período).
export function VendasMesHeroCard({ hero }: VendasMesHeroCardProps) {
  const [filtro, setFiltro] = useState<FiltroHero>("mes");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const personalizado = filtro === "personalizado";
  const periodo: PeriodoVendasMesHero = personalizado ? PERIODO_PREVIA_PERSONALIZADO : filtro;
  const dadosDoPeriodo = hero[periodo];
  const negativo = dadosDoPeriodo.variacaoPct < 0;

  return (
    <div className="border-border from-card to-accent/40 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6">
      <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
        {/* cor explícita: o default do PeriodToggle é COR_ROSA do
            dashboard-vendas, uma custom property que só existe dentro de
            .dashboard-vendas-scope — fora de lá (aqui, no executivo) o
            pill ativo ficava sem cor. hsl(var(--primary)) é o pink padrão
            do resto do app. */}
        <PeriodToggle
          opcoes={OPCOES_PERIODO}
          valor={filtro}
          onChange={setFiltro}
          cor="hsl(var(--primary))"
        />

        {personalizado ? (
          <PersonalizadoDateRange
            dataInicial={dataInicial}
            dataFinal={dataFinal}
            onDataInicialChange={setDataInicial}
            onDataFinalChange={setDataFinal}
          />
        ) : null}

        <MockBadge />
        <span
          className={
            negativo
              ? "text-destructive inline-flex items-center gap-1 text-sm font-semibold"
              : "text-success inline-flex items-center gap-1 text-sm font-semibold"
          }
        >
          {negativo ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
          <SensitiveValue value={`${Math.abs(dadosDoPeriodo.variacaoPct).toFixed(1)}%`} />
        </span>
        <span className="text-muted-foreground text-[11px]">vs mesmo dia do mês anterior</span>
      </div>

      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {TITULO_POR_PERIODO[periodo]}
      </p>
      <p className="text-foreground mt-1 text-4xl font-bold tracking-tight">
        <SensitiveValue value={formatarMoedaCompleta(dadosDoPeriodo.valor)} />
      </p>
      <p className="text-muted-foreground mt-1 text-sm">
        <SensitiveValue value={dadosDoPeriodo.bilhetes} /> bilhetes ·{" "}
        <SensitiveValue value={dadosDoPeriodo.agenciasVendendo} /> agências vendendo
      </p>

      {personalizado ? <PersonalizadoAviso periodoPreviaLabel="Mês" /> : null}
    </div>
  );
}

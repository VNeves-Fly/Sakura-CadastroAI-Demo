"use client";

import { cn } from "@/lib/utils";
import type { PeriodoTv } from "@/modules/tv/types/tv.types";

const OPCOES: { valor: PeriodoTv; label: string }[] = [
  { valor: "hoje", label: "Hoje" },
  { valor: "ontem", label: "Ontem" },
  { valor: "mes", label: "Mês" },
  { valor: "ano", label: "Ano" },
];

interface TvPeriodToggleProps {
  valor: PeriodoTv;
  onChange: (valor: PeriodoTv) => void;
}

// Segmented control Hoje/Mês/Ano — um único filtro pra página toda (ver
// tv-view.tsx), não um por card como no spec original do Lovable (mesma
// decisão do "filtro por tempo" do Dashboard CRM, pedido do usuário,
// 2026-08-20). Tokens globais (bg-primary/text-primary-foreground), sem
// depender de nenhuma cor escopada a outro módulo.
export function TvPeriodToggle({ valor, onChange }: TvPeriodToggleProps) {
  return (
    <div className="bg-muted inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-transparent p-1">
      {OPCOES.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold tracking-wide uppercase transition sm:px-4 sm:text-sm",
              ativo
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}

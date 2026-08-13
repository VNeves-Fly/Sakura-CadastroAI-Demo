"use client";

import { cn } from "@/lib/utils";
import { COR_ROSA } from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";

interface PeriodToggleProps<T extends string> {
  opcoes: { valor: T; label: string }[];
  valor: T;
  onChange: (valor: T) => void;
  cor?: string;
}

// Segmented control genérico — Hoje/Ontem/Este mês/Este ano; Mês/Ano;
// Aéreo+Terrestre/Aéreo/Terrestre. Mesmo desenho visual do pill de
// período já usado em `DashboardKpiCard` (bg-muted + pill ativo colorido).
export function PeriodToggle<T extends string>({
  opcoes,
  valor,
  onChange,
  cor = COR_ROSA,
}: PeriodToggleProps<T>) {
  return (
    <div className="bg-muted flex shrink-0 items-center gap-1 rounded-full p-1">
      {opcoes.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold tracking-wide whitespace-nowrap transition",
              ativo ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
            style={ativo ? { backgroundColor: cor } : undefined}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}

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
// Aéreo+Terrestre/Aéreo/Terrestre; Todos/Nacional/Internacional. Cantos
// quadrados (rounded-lg), no mesmo padrão dos cards do dashboard — não é
// mais pill/rounded-full (pedido do usuário, 2026-08-19).
export function PeriodToggle<T extends string>({
  opcoes,
  valor,
  onChange,
  cor = COR_ROSA,
}: PeriodToggleProps<T>) {
  return (
    <div className="bg-muted flex shrink-0 items-center gap-0.5 rounded-lg p-1 sm:gap-1">
      {opcoes.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap transition sm:px-3 sm:py-1.5 sm:text-xs",
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

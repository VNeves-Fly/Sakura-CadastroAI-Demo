"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiscoCollapsivelProps {
  icon: ReactNode;
  titulo: string;
  contador: number;
  children: ReactNode;
  defaultAberto?: boolean;
}

// CollapsibleRiskTable (SPEC 4.10) — header clicável (ícone + título +
// contador + chevron) que expande a tabela filha. Reaproveitado pelas
// duas seções de risco do dashboard (a tabela em si é um
// SortableDataTable configurado por quem usa este wrapper).
export function RiscoCollapsivel({
  icon,
  titulo,
  contador,
  children,
  defaultAberto = false,
}: RiscoCollapsivelProps) {
  const [aberto, setAberto] = useState(defaultAberto);

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        {icon}
        <span className="text-foreground flex-1 text-sm font-semibold">{titulo}</span>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
          {contador}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            aberto && "rotate-180",
          )}
        />
      </button>
      {aberto ? <div className="border-border border-t">{children}</div> : null}
    </div>
  );
}

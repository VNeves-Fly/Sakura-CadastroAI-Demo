"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CollapsibleSectionProps {
  titulo: string;
  contador: string;
  children: ReactNode;
  aberturaInicial?: boolean;
}

// Cabeçalho colapsável reusado nas 3 seções de tabela (SPEC 8.1/9/10) —
// chevron + título clicáveis, contador à direita, estado local (não
// precisa sobreviver a navegação/refresh).
export function CollapsibleSection({
  titulo,
  contador,
  children,
  aberturaInicial = true,
}: CollapsibleSectionProps) {
  const [aberto, setAberto] = useState(aberturaInicial);

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          className="flex items-center gap-1.5 text-sm font-semibold"
        >
          <ChevronDown className={cn("size-4 transition-transform", !aberto && "-rotate-90")} />
          <span>{titulo}</span>
        </button>
        <span className="text-muted-foreground text-xs whitespace-nowrap">{contador}</span>
      </div>

      {aberto ? children : null}
    </section>
  );
}

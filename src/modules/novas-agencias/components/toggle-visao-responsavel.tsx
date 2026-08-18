"use client";

import { cn } from "@/lib/utils";

export type VisaoResponsavel = "executivos" | "gerentes";

interface ToggleVisaoResponsavelProps {
  visao: VisaoResponsavel;
  onChange: (visao: VisaoResponsavel) => void;
}

const OPCOES: { valor: VisaoResponsavel; label: string }[] = [
  { valor: "executivos", label: "Executivos" },
  { valor: "gerentes", label: "Gerentes" },
];

// Segmented control "Executivos/Gerentes" (SPEC 10.1) — troca o dataset
// da tabela abaixo, tudo client-side sobre os dois arrays mock.
export function ToggleVisaoResponsavel({ visao, onChange }: ToggleVisaoResponsavelProps) {
  return (
    <div className="bg-muted mb-4 inline-flex rounded-lg p-1">
      {OPCOES.map((opcao) => {
        const ativo = visao === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition",
              ativo
                ? "bg-card text-foreground font-medium shadow-sm"
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

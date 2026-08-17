"use client";

import Link from "next/link";
import { LayoutGrid, CalendarDays, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { chave: "dashboard", label: "Dashboard", icon: LayoutGrid, sufixo: "" },
  { chave: "agenda", label: "Agenda", icon: CalendarDays, sufixo: "/agenda" },
  { chave: "agencias", label: "Agências", icon: Building2, sufixo: "/agencias" },
] as const;

interface ExecutivoTabsNavProps {
  executivoId: string;
  abaAtiva: "dashboard" | "agenda" | "agencias";
}

// Nav de abas do detalhe do executivo (SPEC seção 3.3) — ícone + label +
// sublinhado rosa na aba ativa, fora de card (mesmo espírito do
// AbasNav de atribuicoes, mas por rota real, não query string, e com
// ícone).
export function ExecutivoTabsNav({ executivoId, abaAtiva }: ExecutivoTabsNavProps) {
  return (
    <div className="border-border flex gap-1 border-b">
      {ABAS.map((aba) => {
        const ativa = aba.chave === abaAtiva;
        return (
          <Link
            key={aba.chave}
            href={`/executivos/${executivoId}${aba.sufixo}`}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              ativa
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            <aba.icon className="size-4" />
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}

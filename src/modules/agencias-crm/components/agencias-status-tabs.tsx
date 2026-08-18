"use client";

import { LayoutGrid, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTab } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasStatusTabsProps {
  statusTab: StatusTab;
  onChange: (valor: StatusTab) => void;
  contadores: Record<StatusTab, number>;
}

const ABAS: { chave: StatusTab; label: string; icon: typeof LayoutGrid; corAtiva: string }[] = [
  { chave: "todas", label: "Todas", icon: LayoutGrid, corAtiva: "text-primary border-primary" },
  {
    chave: "aprovadas",
    label: "Aprovadas",
    icon: CheckCircle2,
    corAtiva: "text-success border-success",
  },
  {
    chave: "reprovadas_inativas",
    label: "Reprovadas + Inativas",
    icon: XCircle,
    corAtiva: "text-destructive border-destructive",
  },
];

// Abas "underline" da listagem de Agências (SPEC seção 3.2) — cada uma
// mostra o contador real do grupo (calculado em memória a partir da
// carteira já carregada, ver use-agencias-carteira.view-model.ts).
export function AgenciasStatusTabs({ statusTab, onChange, contadores }: AgenciasStatusTabsProps) {
  return (
    <div className="border-border flex gap-1 overflow-x-auto border-b">
      {ABAS.map((aba) => {
        const ativa = aba.chave === statusTab;
        return (
          <button
            key={aba.chave}
            type="button"
            onClick={() => onChange(aba.chave)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
              ativa
                ? aba.corAtiva
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            <aba.icon className="size-4" />
            {aba.label}
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
              {contadores[aba.chave].toLocaleString("pt-BR")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

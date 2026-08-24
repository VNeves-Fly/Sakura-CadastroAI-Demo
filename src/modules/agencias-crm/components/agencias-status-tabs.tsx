"use client";

import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusTab } from "@/modules/agencias-crm/types/agencia-carteira.types";

interface AgenciasStatusTabsProps {
  statusTab: StatusTab;
  onChange: (valor: StatusTab) => void;
  contadores: Record<StatusTab, number>;
}

const ABAS: { chave: StatusTab; label: string }[] = [
  { chave: "ativas", label: "Ativas" },
  { chave: "inativas", label: "Inativas" },
];

// Abas de status (SPEC_AGENCIAS_SAKURA seção 2.4) — só 2 abas, cor ativa
// var(--color-primary) pra ambas (a SPEC não diferencia cor por aba como
// a versão anterior fazia com verde/vermelho).
export function AgenciasStatusTabs({ statusTab, onChange, contadores }: AgenciasStatusTabsProps) {
  return (
    <div className="flex items-stretch gap-1.5 border-b border-[#F0F0F6]">
      {ABAS.map((aba) => {
        const ativa = aba.chave === statusTab;
        return (
          <button
            key={aba.chave}
            type="button"
            onClick={() => onChange(aba.chave)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3.5 py-3 text-[13.5px] font-semibold transition",
              ativa
                ? "border-primary text-primary"
                : "border-transparent text-[#8888AA] hover:text-[#3A3A55]",
            )}
          >
            <LayoutGrid className="size-3.75" />
            {aba.label}
            <span
              className={cn("text-xs font-semibold", ativa ? "text-primary" : "text-[#8888AA]/60")}
            >
              {contadores[aba.chave].toLocaleString("pt-BR")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

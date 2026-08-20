"use client";

import Link from "next/link";
import { LayoutGrid, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { chave: "dashboard", label: "Dashboard", icon: LayoutGrid, sufixo: "" },
  { chave: "executivos", label: "Executivos", icon: Users, sufixo: "/executivos" },
  { chave: "agencias", label: "Agências", icon: Building2, sufixo: "/agencias" },
] as const;

interface GestorTabsNavProps {
  gestorId: string;
  // "agenda" removida (pedido do usuário, 2026-08-20) — aba e rota
  // apagadas, ver gestor-detalhe-shell.tsx.
  abaAtiva: "dashboard" | "executivos" | "agencias";
}

// Nav de abas do detalhe do gestor — mesmo padrão visual de
// ExecutivoTabsNav (ícone + label + sublinhado rosa na aba ativa). Só
// "Dashboard" tem conteúdo construído nesta fase; Executivos/Agências
// entram em fases seguintes, mesmo espírito do rollout faseado do módulo
// Executivos (dashboard primeiro, depois agências).
export function GestorTabsNav({ gestorId, abaAtiva }: GestorTabsNavProps) {
  return (
    <div className="border-border flex gap-1 border-b">
      {ABAS.map((aba) => {
        const ativa = aba.chave === abaAtiva;
        return (
          <Link
            key={aba.chave}
            href={`/crm/gestores/${gestorId}${aba.sufixo}`}
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

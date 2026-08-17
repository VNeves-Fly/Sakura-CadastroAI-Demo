"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { GestorProfileHeader } from "@/modules/gestores/components/gestor-profile-header";
import { GestorTabsNav } from "@/modules/gestores/components/gestor-tabs-nav";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorDetalheShellProps {
  perfil: GestorPerfil;
  abaAtiva: "dashboard" | "executivos" | "agenda" | "agencias";
  children: ReactNode;
}

// Cabeçalho de página + cartão de identificação + tabs — compartilhado
// pelas 4 abas do detalhe do gestor (SPEC pedida pelo usuário, 2026-08-17:
// "não esquece de reaproveitar os componentes"). Cada view de aba só
// precisa montar o conteúdo específico e passar como children.
export function GestorDetalheShell({ perfil, abaAtiva, children }: GestorDetalheShellProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <nav className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span>Comercial</span>
            <span aria-hidden>›</span>
            <Link href="/crm/gestores" className="hover:text-foreground">
              Gestores
            </Link>
            <span aria-hidden>›</span>
            <span className="text-foreground font-medium">{perfil.nome}</span>
          </nav>
          <h1 className="text-foreground text-xl font-semibold">Detalhes do Gestor</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="border-input text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition"
          >
            <Download className="size-4" />
            Exportar
          </button>
        </div>
      </div>

      <GestorProfileHeader perfil={perfil} />
      <GestorTabsNav gestorId={perfil.id} abaAtiva={abaAtiva} />

      {children}
    </div>
  );
}

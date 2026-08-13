"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsiblePanelProps {
  // Já renderizado (ex.: `<Target className="size-4" />`), nunca o
  // componente em si — função de ícone não atravessa a fronteira
  // Server→Client Component como prop (mesmo cuidado do
  // `SecaoColapsavel` no dossiê de cadastro).
  icon: ReactNode;
  titulo: string;
  subtitulo?: string;
  badgeTexto: string;
  badgeTom: "success" | "warning" | "danger";
  defaultAberto?: boolean;
  children: React.ReactNode;
}

const TOM_CLASSES: Record<CollapsiblePanelProps["badgeTom"], string> = {
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-destructive-bg text-destructive-text",
};

// Cabeçalho com badge de status + chevron pra expandir/recolher — usado
// em "Acurácia da projeção" (4.5), mas genérico o bastante pra outros
// painéis colapsáveis futuros.
export function CollapsiblePanel({
  icon,
  titulo,
  subtitulo,
  badgeTexto,
  badgeTom,
  defaultAberto = false,
  children,
}: CollapsiblePanelProps) {
  const [aberto, setAberto] = useState(defaultAberto);

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-foreground text-sm font-semibold">{titulo}</h2>
            {subtitulo ? <p className="text-muted-foreground mt-0.5 text-xs">{subtitulo}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", TOM_CLASSES[badgeTom])}>
            {badgeTexto}
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 transition-transform",
              aberto && "rotate-180",
            )}
          />
        </div>
      </button>

      {aberto ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

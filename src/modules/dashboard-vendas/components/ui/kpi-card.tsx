import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  cor: string;
  corFundoIcone: string;
  label: string;
  valor: string;
  legenda?: string;
  badgeTopo?: string;
  badgeRodape?: string;
}

// Ícone circular colorido + rótulo + valor + legenda, com até 2 badges
// nos cantos (participação/margem) — cards "Aéreo"/"Terrestre" (4.1) e
// base pros mini-KPIs (4.2). Sem `"use client"`: só recebe cores/textos,
// o ícone já vem resolvido de quem renderiza (ver nota de arquitetura
// sobre LucideIcon não atravessar a fronteira Server→Client como prop).
export function KpiCard({
  icon: Icon,
  cor,
  corFundoIcone,
  label,
  valor,
  legenda,
  badgeTopo,
  badgeRodape,
}: KpiCardProps) {
  return (
    <div className="border-border bg-card relative flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
      {badgeTopo ? (
        <span
          className="absolute top-4 right-4 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ backgroundColor: corFundoIcone, color: cor }}
        >
          {badgeTopo}
        </span>
      ) : null}

      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: corFundoIcone }}
      >
        <Icon className="size-5" style={{ color: cor }} />
      </span>

      <div>
        <p className="text-[11px] font-bold tracking-wide uppercase" style={{ color: cor }}>
          {label}
        </p>
        <p className="text-foreground mt-1 text-2xl font-black sm:text-[28px]">{valor}</p>
        {legenda ? <p className="text-muted-foreground mt-0.5 text-xs">{legenda}</p> : null}
      </div>

      {badgeRodape ? (
        <span
          className="absolute right-4 bottom-4 rounded-full px-3 py-1 text-sm font-bold tracking-wide sm:px-3.5 sm:py-1.5 sm:text-base"
          style={{ backgroundColor: corFundoIcone, color: cor }}
        >
          {badgeRodape}
        </span>
      ) : null}
    </div>
  );
}

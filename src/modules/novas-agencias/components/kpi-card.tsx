import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  valor: string;
  corValor?: string;
}

// Card padrão dos grids de KPI (SPEC seções 5/6) — badge circular
// cinza com o ícone, label em caixa alta, valor grande colorido
// conforme a semântica (preto/vermelho/verde/laranja) e o indicador de
// "abrir/expandir" no canto (decorativo aqui, sem destino real).
export function KpiCard({ icon: Icon, label, valor, corValor = "text-foreground" }: KpiCardProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full">
            <Icon className="text-muted-foreground size-3.5" />
          </span>
          <span className="min-w-0 truncate">{label}</span>
        </div>
        <ArrowUpRight className="text-muted-foreground/50 size-3.5 shrink-0" />
      </div>
      <div className={`text-2xl font-bold break-words ${corValor}`}>{valor}</div>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface HighlightKpiCardProps {
  icon: LucideIcon;
  label: string;
  valor: string;
  subtitulo: string;
}

// Card "Tempo médio até a 1ª compra" (SPEC 7.1) — única variante
// centralizada/rosa da página, contrastando com os demais cards
// (alinhados à esquerda).
export function HighlightKpiCard({ icon: Icon, label, valor, subtitulo }: HighlightKpiCardProps) {
  return (
    <div className="bg-accent flex h-full flex-col items-center justify-center rounded-xl p-6 text-center">
      <div className="text-muted-foreground mb-auto flex items-center gap-1.5 self-start text-xs font-medium">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-primary text-3xl font-bold">{valor}</div>
      <div className="text-primary/70 mt-1 text-xs">{subtitulo}</div>
    </div>
  );
}

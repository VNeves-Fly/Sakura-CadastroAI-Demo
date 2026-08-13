import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ChartCardProps {
  icon: LucideIcon;
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  legenda?: ReactNode;
  children: ReactNode;
}

// Wrapper padrão de todo card com gráfico — cabeçalho (ícone, título,
// subtítulo, ações à direita) + área do gráfico + legenda opcional
// embaixo. Mesmo miolo visual de `GraficoOrigemContrato`/
// `GraficoContratosPorDia`, só que reutilizável entre seções.
export function ChartCard({
  icon: Icon,
  titulo,
  subtitulo,
  acoes,
  legenda,
  children,
}: ChartCardProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div>
            <h2 className="text-foreground text-sm font-semibold">{titulo}</h2>
            {subtitulo ? <p className="text-muted-foreground mt-0.5 text-xs">{subtitulo}</p> : null}
          </div>
        </div>
        {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
      </div>

      <div className="mt-4">{children}</div>

      {legenda ? <div className="mt-3">{legenda}</div> : null}
    </div>
  );
}

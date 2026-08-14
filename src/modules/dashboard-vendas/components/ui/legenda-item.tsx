interface LegendaItemProps {
  cor: string;
  nome: string;
  valor?: string;
}

// Bolinha colorida + nome (+ valor total opcional) — legenda customizada
// dos gráficos (4.3, 4.8, 4.9, 4.10), sempre no lugar da legenda nativa
// do ApexCharts (`legend: { show: false }`).
export function LegendaItem({ cor, nome, valor }: LegendaItemProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
      <span className="text-muted-foreground">{nome}</span>
      {valor ? <span className="text-foreground font-semibold">{valor}</span> : null}
    </span>
  );
}

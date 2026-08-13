interface MultiMetricCardProps {
  titulo: string;
  valor: string;
  submetricas: { label: string; valor: string }[];
  linhasExtras?: { label: string; valor: string }[];
}

// Valor principal + lista de submétricas — "Compraram (30D)", "Compraram
// em 2026", "+30 dias sem vendas", "Sem vendas em 2026" (4.6).
export function MultiMetricCard({
  titulo,
  valor,
  submetricas,
  linhasExtras,
}: MultiMetricCardProps) {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{titulo}</p>
        <p className="text-foreground mt-1 text-2xl font-black sm:text-[28px]">{valor}</p>
      </div>

      <dl className="flex flex-col gap-1.5">
        {submetricas.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="text-foreground font-semibold">{item.valor}</dd>
          </div>
        ))}
      </dl>

      {linhasExtras?.length ? (
        <dl className="border-border flex flex-col gap-1.5 border-t pt-2">
          {linhasExtras.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="text-foreground font-semibold">{item.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

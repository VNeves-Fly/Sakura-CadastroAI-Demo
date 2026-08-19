import { cn } from "@/lib/utils";

interface MultiMetricCardProps {
  titulo: string;
  valor: string;
  submetricas: { label: string; valor: string }[];
  linhasExtras?: { label: string; valor: string }[];
  // Opcional — card inteiro fica clicável (abre modal de detalhamento).
  aoClicar?: () => void;
  // Fundo rosa bem clarinho pra sinalizar campo de atenção/negativo (ex.:
  // "+30 dias sem vendas", "Sem vendas em 2026") — pedido do usuário,
  // 2026-08-19, cor #FFB6C1 em baixa opacidade.
  destaque?: boolean;
}

// Valor principal + lista de submétricas — "Compraram (30D)", "Compraram
// em 2026", "+30 dias sem vendas", "Sem vendas em 2026" (4.6).
export function MultiMetricCard({
  titulo,
  valor,
  submetricas,
  linhasExtras,
  aoClicar,
  destaque,
}: MultiMetricCardProps) {
  const conteudo = (
    <>
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
    </>
  );

  if (aoClicar) {
    return (
      <button
        type="button"
        onClick={aoClicar}
        className={cn(
          "border-border bg-card hover:border-primary/40 flex flex-col gap-3 rounded-2xl border p-4 text-left transition sm:p-5",
          destaque && "bg-[#FFB6C1]/15",
        )}
      >
        {conteudo}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5",
        destaque && "bg-[#FFB6C1]/15",
      )}
    >
      {conteudo}
    </div>
  );
}

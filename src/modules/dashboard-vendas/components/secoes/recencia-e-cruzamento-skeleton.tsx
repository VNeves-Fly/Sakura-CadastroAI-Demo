import { LoadingBall } from "@/components/ui/loading-ball";
import { cn } from "@/lib/utils";
import { anoAnterior, anoAtual } from "@/modules/dashboard-vendas/utils/formatar-data.util";

// Placeholder de RecenciaKpisGrid (ver recencia-kpis-grid.tsx, montado
// sobre MultiMetricCard em ui/multi-metric-card.tsx) enquanto
// obterRecenciaECruzamento() resolve via Suspense. Títulos e labels de
// submétrica são texto estático (o ano vem de anoAtual()/anoAnterior(),
// calculado em runtime — não depende do SST, só do relógio); só os
// valores numéricos viram LoadingBall. "Cruzamento Aéreo x Terrestre"
// segue oculto (ver recencia-e-cruzamento-secao.tsx), por isso não tem
// skeleton aqui.

function MultiMetricCardSkeleton({
  titulo,
  submetricas,
  linhasExtras,
  destaque,
}: {
  titulo: string;
  submetricas: string[];
  linhasExtras?: string[];
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5",
        destaque && "bg-[#FFB6C1]/15",
      )}
    >
      <div>
        <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">{titulo}</p>
        <div className="mt-1 flex h-[1.7em] items-center sm:h-[1.9em]">
          <LoadingBall size="lg" />
        </div>
      </div>

      <dl className="flex flex-col gap-1.5">
        {submetricas.map((label) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>
              <LoadingBall size="xs" />
            </dd>
          </div>
        ))}
      </dl>

      {linhasExtras?.length ? (
        <dl className="border-border flex flex-col gap-1.5 border-t pt-2">
          {linhasExtras.map((label) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>
                <LoadingBall size="xs" />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function RecenciaECruzamentoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MultiMetricCardSkeleton
        titulo="Compraram (30D)"
        submetricas={["só aéreo", "só terrestre", "e ambos"]}
      />
      <MultiMetricCardSkeleton
        titulo={`Compraram em ${anoAtual()}`}
        submetricas={["só aéreo", "só terrestre", "e ambos"]}
      />
      <MultiMetricCardSkeleton
        titulo="+30 dias sem vendas"
        destaque
        submetricas={["31–89D sem vender", "90–179D sem vender", "+180D sem vender"]}
      />
      <MultiMetricCardSkeleton
        titulo={`Sem vendas em ${anoAtual()}`}
        destaque
        submetricas={["só aéreo", "só terrestre", "e ambos"]}
        linhasExtras={[
          `compraram em ${anoAnterior()}`,
          `compraram em ${anoAtual()}`,
          `só em ${anoAnterior()}`,
        ]}
      />
    </div>
  );
}

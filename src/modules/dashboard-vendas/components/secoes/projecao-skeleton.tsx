import { Info, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import {
  COR_ROSA,
  COR_ROXO,
} from "@/modules/dashboard-vendas/constants/dashboard-vendas.constants";

// Placeholder de ProjecaoDoDiaCard (ver projecao-do-dia-card.tsx) enquanto
// obterProjecao() resolve via Suspense. Cabeçalho/badges/labels são texto
// estático (não dependem do SST); os números viram LoadingBall e a curva
// (ApexChart, formato desconhecido até os dados chegarem) vira Skeleton do
// tamanho exato do gráfico real (height=280).
export function ProjecaoSkeleton() {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-muted-foreground size-4 shrink-0" />
          <h2 className="text-foreground text-sm font-semibold">Projeção do dia</h2>
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
            Histórico do dia da semana
          </span>
          <span className="text-muted-foreground flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
            <SlidersHorizontal className="size-3.5" />
            Parâmetros
          </span>
          <Info className="text-muted-foreground size-3.5" />
        </div>
        {/* "às HH:MM · X% do dia" depende do relógio + SST */}
        <Skeleton className="h-3 w-32 shrink-0" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex h-9 items-center sm:h-10">
              <LoadingBall size="lg" />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Faixa</p>
            <div className="bg-muted relative mt-2 h-1.5 w-full rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Realizado
              </p>
              <div className="mt-1 flex h-[1.6em] items-center">
                <LoadingBall size="default" />
              </div>
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                A emitir
              </p>
              <div className="mt-1 flex h-[1.6em] items-center">
                <LoadingBall size="default" />
              </div>
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <span className="size-2 rounded-full" style={{ backgroundColor: COR_ROXO }} />
                Nacional
              </p>
              <div className="mt-1 flex h-[1.6em] items-center">
                <LoadingBall size="default" />
              </div>
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
            <div className="border-border rounded-xl border p-3">
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <span className="size-2 rounded-full" style={{ backgroundColor: COR_ROSA }} />
                Internacional
              </p>
              <div className="mt-1 flex h-[1.6em] items-center">
                <LoadingBall size="default" />
              </div>
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
          </div>
        </div>

        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    </div>
  );
}

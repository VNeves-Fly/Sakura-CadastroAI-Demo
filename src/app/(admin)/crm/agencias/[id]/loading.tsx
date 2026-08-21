import { Skeleton } from "@/components/ui/skeleton";

// Fallback automático do Next (App Router) pra esta rota — sem isto, a
// navegação pra /crm/agencias/[id] fica parada na tela anterior até
// page.tsx terminar de resolver TODAS as chamadas ao SST (cadastro
// comercial + vendas), o que pode levar alguns segundos. Com este
// arquivo, o Next envolve page.tsx num Suspense automático e mostra isto
// na hora do clique, trocando pro conteúdo real assim que resolver —
// mesmo espírito de AgenciasListaSkeleton na listagem.
export default function AgenciaDetalheLoading() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Skeleton className="h-[34px] w-56 rounded-full" />

      <div className="border-border bg-card w-full rounded-2xl border shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="size-[30px] rounded-lg" />
        </div>

        <div className="border-border flex gap-4 border-b px-5 pt-4">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, indice) => (
            <Skeleton key={indice} className="h-28 w-full rounded-xl" />
          ))}
          <Skeleton className="h-40 w-full rounded-xl sm:col-span-2" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

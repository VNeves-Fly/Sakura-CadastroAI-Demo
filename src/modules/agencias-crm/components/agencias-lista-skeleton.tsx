import { Skeleton } from "@/components/ui/skeleton";

// Placeholder da página inteira (título + toolbar + tabs + tabela +
// paginação) enquanto carregarAgenciasCarteira() resolve via Suspense
// (ver page.tsx) — a página abre com isto na hora, sem esperar o banco
// local nem as chamadas ao SST. Mesmo espírito de SecaoSkeleton
// (executivo/dashboard), só cobrindo a página inteira, já que aqui o
// toolbar/filtros/tabela dependem todos do array de agências carregado
// (opções de filtro derivam dos dados, não tem como mostrar a UI real
// parcialmente pronta).
export function AgenciasListaSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-48" />
      </div>

      <div className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 8 }, (_, indice) => (
            <Skeleton key={indice} className="h-10 w-full" />
          ))}
        </div>
        <div className="border-border flex items-center justify-between border-t px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-40" />
        </div>
      </div>
    </div>
  );
}

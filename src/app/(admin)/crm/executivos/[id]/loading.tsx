import { Skeleton } from "@/components/ui/skeleton";

// Fallback automático do Next (App Router) pra esta rota — sem isto, a
// navegação pra /crm/executivos/[id] fica parada na tela anterior até
// page.tsx terminar de resolver as buscas locais (Promotor + Gestores +
// Agências, tudo Prisma). São rápidas, mas cobrem um cold start de banco
// ou muitas agências/gestores como rede de segurança. A view interna
// (ExecutivoDashboardView) já dispara o SST pesado via Suspense próprio
// depois que este loading sai de cena — não duplicar esse streaming aqui.
// Mesmo espírito de crm/agencias/[id]/loading.tsx.
export default function ExecutivoDetalheLoading() {
  return (
    <div className="flex w-full flex-col gap-5">
      <Skeleton className="h-[34px] w-56 rounded-full" />

      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <Skeleton className="size-[30px] rounded-lg" />
        </div>

        <div className="border-border mt-6 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-border flex gap-4 border-b pt-1">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>

      <Skeleton className="h-40 w-full rounded-2xl" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, indice) => (
          <Skeleton key={indice} className="h-48 w-full rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

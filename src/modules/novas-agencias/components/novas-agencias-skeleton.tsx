import { Skeleton } from "@/components/ui/skeleton";

// Placeholder da página inteira (título + funil + resumo + lista)
// enquanto carregarNovasAgencias() resolve via Suspense (ver page.tsx) —
// a página abre com isto na hora, sem esperar o banco local nem as
// chamadas ao SST. Mesmo padrão de AgenciasListaSkeleton (agencias-crm).
export function NovasAgenciasSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      <div className="flex flex-col gap-[18px] rounded-2xl border border-[#ECECF4] bg-white p-[22px_24px]">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-5">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, indice) => (
          <div
            key={indice}
            className="flex flex-col gap-2 rounded-2xl border border-[#ECECF4] bg-white p-[20px_22px]"
          >
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#ECECF4] bg-white">
        <div className="flex items-center justify-between px-[22px] pt-[18px] pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="flex flex-col gap-3 px-[22px] pb-[18px]">
          {Array.from({ length: 6 }, (_, indice) => (
            <Skeleton key={indice} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

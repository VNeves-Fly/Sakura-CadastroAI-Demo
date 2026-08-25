import { Skeleton } from "@/components/ui/skeleton";

// Fallback automático do Next (App Router) pra esta rota — mesmo espírito
// do loading.tsx de /crm/agencias/[id]. Hoje page.tsx só lê o mock em
// memória (novas-agencias.mock-service.ts), então isto praticamente nunca
// aparece; existe como rede de segurança caso o serviço passe a bater em
// algo real (SST/banco) no futuro, sem precisar mexer na página de novo.
export default function NovasAgenciasLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-3.5 w-48" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-40 w-full rounded-2xl" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </div>

      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

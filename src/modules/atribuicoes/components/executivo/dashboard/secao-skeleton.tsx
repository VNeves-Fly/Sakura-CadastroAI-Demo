import { Skeleton } from "@/components/ui/skeleton";

interface SecaoSkeletonProps {
  altura?: string;
}

// Placeholder de uma seção pesada enquanto ela carrega via Suspense (ver
// executivo-dashboard-view.tsx) — mesmo miolo visual de card do resto do
// dashboard, só com `Skeleton` no lugar do conteúdo real. Cópia local do
// equivalente em dashboard-vendas/components/secoes/ (evita acoplar este
// módulo a outro só por um componente de skeleton).
export function SecaoSkeleton({ altura = "h-56" }: SecaoSkeletonProps) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <Skeleton className="h-5 w-48" />
      <Skeleton className={`mt-4 w-full ${altura}`} />
    </div>
  );
}

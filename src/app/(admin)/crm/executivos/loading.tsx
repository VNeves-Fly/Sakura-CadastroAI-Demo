import { Skeleton } from "@/components/ui/skeleton";

// Fallback automático do Next (App Router) pra /crm/executivos — cobre o
// intervalo entre o clique na navegação e page.tsx + o chunk client de
// PromotoresView terminarem de carregar. page.tsx em si é rápido (só
// Prisma: listarGestores + basesController.list), mas sem isto a tela
// anterior fica parada até a hidratação; com este arquivo o Next mostra
// isto na hora do clique. O gargalo real de dados (vendas por SST) é
// tratado à parte, dentro da própria tabela (ver
// ExecutivosListaTabelaSkeleton), já que ele acontece depois da
// hidratação, num fetch client-side que este loading.tsx não alcança.
export default function ExecutivosListaLoading() {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <Skeleton className="h-7 w-40" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-[38px] min-w-[250px] flex-1 rounded-full" />
        <Skeleton className="h-[38px] w-40 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-t-lg border border-[#F7DCEB]">
        <Skeleton className="h-11 w-full rounded-none" />
        <div className="flex flex-col gap-3 bg-white p-4">
          {Array.from({ length: 8 }, (_, indice) => (
            <Skeleton key={indice} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

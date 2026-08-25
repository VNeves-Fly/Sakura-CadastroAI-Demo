import { Skeleton } from "@/components/ui/skeleton";

// Placeholder da página inteira (título + toolbar + tabela + paginação)
// enquanto calcularVendasPorGestor() resolve via Suspense (ver page.tsx) —
// a página abre com isto na hora, sem esperar o loop de chamadas ao SST
// (uma por promotor, ver vendas-por-gestor.loader.ts). Mesmo espírito de
// AgenciasListaSkeleton: aqui GestoresView recebe vendasPorGestor já
// resolvido (não uma promise granular por célula), então não tem como
// montar a tabela real com só a coluna de vendas "carregando" sem tocar em
// gestores-view.tsx/tabela/adapter — fora do escopo desta mudança.
export function GestoresListaSkeleton() {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <Skeleton className="h-7 w-32" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-[38px] min-w-[250px] flex-1 rounded-full" />
        <Skeleton className="h-[38px] w-36 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#F7DCEB]">
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 8 }, (_, indice) => (
            <Skeleton key={indice} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

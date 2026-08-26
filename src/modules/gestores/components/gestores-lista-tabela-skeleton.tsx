import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import { COLS } from "@/modules/gestores/components/gestores-lista-tabela";

// Corpo placeholder de GestoresListaTabela enquanto useGestoresListViewModel
// espera GET /api/gestores — mesmo padrão de
// executivos-lista-tabela-skeleton.tsx (Nome/Nível/Executivos usam Skeleton,
// Vendas mês/ano usam LoadingBall — "bolinha rosa quicando" em vez de barra
// cinza estática, pedido do usuário 2026-08-26). Vendas mês/ano aqui vêm
// resolvidas na page.tsx via Suspense (ver GestoresListaSkeleton), então na
// prática este branch costuma ser rápido — mas o visual fica consistente
// com a tabela de Executivos de qualquer forma.
export function GestoresListaTabelaSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }, (_, indice) => (
        <div
          key={indice}
          className="grid items-center gap-4 border-b border-[#F7DCEB] bg-white px-4 py-3.5"
          style={{ gridTemplateColumns: COLS }}
        >
          <Skeleton className="h-4 w-32" />
          <div className="flex justify-center">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex justify-center">
            <LoadingBall size="xs" />
          </div>
          <div className="flex justify-center">
            <LoadingBall size="xs" />
          </div>
          <span />
        </div>
      ))}
    </div>
  );
}

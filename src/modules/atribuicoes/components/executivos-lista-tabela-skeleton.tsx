import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import { COLS } from "@/modules/atribuicoes/components/executivos-lista-tabela";

// Corpo placeholder de ExecutivosListaTabela enquanto
// useExecutivosListaViewModel espera GET /api/promotores — que só resolve
// depois do fan-out de 1 chamada ao SST por promotor (ver comVendasReais em
// promotores.routes.ts), podendo levar vários segundos em cache frio. Nome/
// Gestor usam Skeleton (viriam do banco local, seriam rápidos se um dia o
// fetch for dividido em duas etapas); Vendas mês/ano usam LoadingBall
// porque são literalmente a métrica presa no SST.
export function ExecutivosListaTabelaSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }, (_, indice) => (
        <div
          key={indice}
          className="grid items-center gap-4 border-b border-[#F7DCEB] bg-white px-4 py-3.5"
          style={{ gridTemplateColumns: COLS }}
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
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

import { Filter, Plane, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";

// Placeholder de TopAgenciasCard + TopFornecedoresCard (ver
// top-agencias-card.tsx e top-fornecedores-card.tsx, ambos montados sobre
// RankedList em ui/ranked-list.tsx) enquanto obterResumoEDia() resolve via
// Suspense. 5 linhas de placeholder (a lista real tem até 10) — mesmo
// critério de TvSkeleton.

const LINHAS = 5;

function FiltroChromeSkeleton() {
  // Chrome fechado de FiltroTipoRotaPopover (ver
  // ui/filtro-tipo-rota-popover.tsx) — só interativo depois de hidratar.
  return (
    <span className="border-input text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold sm:px-3">
      <Filter className="size-3.5" />
      Filtrar
    </span>
  );
}

function LinhaAgenciaSkeleton({ posicao }: { posicao: number }) {
  // Ícone do canal (Aéreo/Terrestre/Ambos) só é conhecido depois do SST
  // responder — vira Skeleton, não LoadingBall (não é um número).
  return (
    <li className="flex items-center gap-3">
      <span className="text-muted-foreground w-4 shrink-0 text-xs font-bold">{posicao}</span>
      <Skeleton className="size-3.5 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="shrink-0 text-right">
        <LoadingBall size="xs" className="ml-auto" />
      </div>
    </li>
  );
}

function LinhaFornecedorSkeleton({ indice }: { indice: number }) {
  // Molde de LogoFornecedor (círculo com iniciais) + subtítulo "X
  // bilhetes · AÉREO" — nome e contagem só vêm do SST.
  return (
    <li key={indice} className="flex items-center gap-3">
      <Skeleton className="size-6 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
      <div className="shrink-0 text-right">
        <LoadingBall size="xs" className="ml-auto" />
      </div>
    </li>
  );
}

export function RankingsSkeleton() {
  return (
    <>
      <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Trophy className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <h2 className="text-foreground text-sm font-semibold">Top 10 Agências</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">Modalidade: Aéreo + Terrestre</p>
            </div>
          </div>
          <FiltroChromeSkeleton />
        </div>
        <ul className="mt-3 flex flex-col gap-2.5">
          {Array.from({ length: LINHAS }, (_, indice) => (
            <LinhaAgenciaSkeleton key={indice} posicao={indice + 1} />
          ))}
        </ul>
      </div>

      <div className="border-border bg-card flex flex-col rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Plane className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <div>
              <h2 className="text-foreground text-sm font-semibold">Top 10 Fornecedores</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">% = participação no volume</p>
            </div>
          </div>
          <FiltroChromeSkeleton />
        </div>
        <ul className="mt-3 flex flex-col gap-2.5">
          {Array.from({ length: LINHAS }, (_, indice) => (
            <LinhaFornecedorSkeleton key={indice} indice={indice} />
          ))}
        </ul>
      </div>
    </>
  );
}

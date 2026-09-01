import {
  Bus,
  Calendar,
  CalendarDays,
  CalendarRange,
  Plane,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";

// Placeholder da Fast View inteira enquanto tvController.obterDados()
// resolve via Suspense (ver page.tsx). Reproduz o chrome real de cada
// card (ícone, cor, label, moldura) — que não depende dos dados — e só
// troca por LoadingBall/Skeleton o que de fato vem do tv.mock-service.ts.
// É um painel pensado pra telão (Fast View), por isso o LoadingBall
// (bolinha pulsando) nas células/números principais em vez de um cinza
// genérico only: reforça "isto está vivo, só ainda não chegou" em vez de
// "isto travou".

function CardValorSkeleton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  // Molde de TvVendasCard (ver tv-vendas-card.tsx) — label/ícone reais,
  // "Margem" e o valor principal viram LoadingBall.
  return (
    <div className="border-primary/15 bg-card relative min-w-0 overflow-hidden rounded-xl border p-3 shadow-[0_4px_14px_-8px_rgba(246,15,158,0.25)] sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-primary flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold tracking-widest uppercase">
          <Icon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <div className="border-border bg-muted flex min-w-[4.8rem] shrink-0 flex-col items-center gap-1 rounded-md border px-2.5 py-1.5">
          <div className="text-muted-foreground text-[0.65rem] font-semibold tracking-wider whitespace-nowrap uppercase">
            Margem
          </div>
          <LoadingBall size="xs" />
        </div>
      </div>

      <div className="mt-2 flex h-[1.5em] items-center sm:h-[1.9em]">
        <LoadingBall size="lg" />
      </div>
    </div>
  );
}

const MINI_STATS = ["Bilhetes", "Agências", "Ticket médio"];

function CanalCardSkeleton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  // Molde de TvCanalCard (ver tv-canal-card.tsx).
  return (
    <div className="border-border bg-card flex min-w-0 flex-col gap-2 rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-lg p-2">
          <Icon className="size-4 text-white sm:size-5" />
        </span>
        <span className="text-primary min-w-0 flex-1 truncate text-base font-bold sm:text-xl">
          {label}
        </span>
      </div>

      <div className="flex h-[1.6em] items-center py-1 sm:h-[1.9em]">
        <LoadingBall size="lg" />
      </div>

      <div className="flex min-w-0 flex-row gap-1.5">
        {MINI_STATS.map((rotulo) => (
          <div
            key={rotulo}
            className="border-border bg-muted min-w-0 flex-1 rounded-lg border px-2 py-1.5"
          >
            <div className="text-muted-foreground truncate text-[0.65rem] font-semibold tracking-wider uppercase">
              {rotulo}
            </div>
            <div className="mt-1 flex">
              <LoadingBall size="xs" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Skeleton className="mb-1 h-3 w-full" />
        <Skeleton className="h-1.5 w-full rounded-full sm:h-2" />
      </div>
    </div>
  );
}

function ShareAereoCardSkeleton() {
  // Molde de TvShareAereoCard (ver tv-share-aereo-card.tsx) — 4 linhas
  // fixas (Azul/Gol/Latam/Outras).
  return (
    <div className="border-border bg-card flex min-w-0 flex-col gap-3 rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-lg p-2">
          <Plane className="size-4 text-white sm:size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-primary truncate text-base font-bold sm:text-xl">Share Aéreo</div>
          <div className="text-muted-foreground text-[0.7rem] font-semibold tracking-wider uppercase">
            Nacional
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-2">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-16" />
              <LoadingBall size="xs" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full sm:h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Top10CardSkeleton({ titulo, escopoLabel }: { titulo: string; escopoLabel: string }) {
  // Molde de TvTop10Card (ver tv-top10-card.tsx) — título/escopo reais
  // (fixos, não dependem do período nem do SST), 5 linhas de placeholder
  // (a lista real tem até 10, mas o skeleton não precisa do tamanho
  // exato pra passar a ideia de carregando).
  return (
    <div className="border-border bg-card flex min-w-0 flex-col rounded-2xl border p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="bg-primary flex shrink-0 items-center justify-center rounded-md p-1.5">
          <Trophy className="size-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-foreground truncate text-base font-bold">{titulo}</div>
          <div className="text-muted-foreground truncate text-[0.7rem] font-semibold tracking-wider uppercase">
            {escopoLabel}
          </div>
        </div>
      </div>

      <ol className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, indice) => (
          <li
            key={indice}
            className="border-border bg-card rounded-md border px-2 py-1 shadow-[0_1px_0_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground w-6 shrink-0 text-right font-semibold tabular-nums">
                {indice + 1}
              </span>
              <Skeleton className="h-3.5 flex-1" />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 pl-8">
              <LoadingBall size="xs" />
              <Skeleton className="h-3 w-10" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TvSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Molde de TvHeader (ver tv-header.tsx) — título/subtítulo são
          texto estático (não dependem de `dados`), só o relógio/selo de
          sync viram placeholder aqui (o real é client-only mesmo). */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-foreground text-xl font-bold sm:text-2xl">Fast View</h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Atualizado em tempo real
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <LoadingBall size="sm" />
          <span className="text-muted-foreground text-xs font-semibold">carregando</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CardValorSkeleton icon={Calendar} label="Vendas Hoje" />
        <CardValorSkeleton icon={CalendarDays} label="Vendas no Mês" />
        <CardValorSkeleton icon={CalendarRange} label="Vendas no Ano" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Os blocos abaixo seguem o período selecionado
        </p>
        <Skeleton className="h-8 w-52 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CanalCardSkeleton icon={Plane} label="Aéreo" />
        <CanalCardSkeleton icon={Bus} label="Terrestre" />
        <ShareAereoCardSkeleton />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Top10CardSkeleton titulo="Top 10 Clientes" escopoLabel="Aéreo (I + N) + Terrestre" />
        <Top10CardSkeleton titulo="Top 10 Nacional" escopoLabel="Aéreo Nacional" />
        <Top10CardSkeleton titulo="Top 10 Internacional" escopoLabel="Aéreo Internacional" />
      </div>
    </div>
  );
}

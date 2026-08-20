import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import type { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";

interface ExecutivoHeaderStatsProps {
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>;
}

// Slots reais (SST) pros stats de topo de `ExecutivoProfileHeader`
// ("Agências"/"Venderam últimos 30d") — pedido do usuário (2026-08-20)
// depois de constatar que os números do banco local (`Agencia.executivoId`,
// preenchido manualmente por analista) ficam zerados mesmo pra executivos
// com carteira real no SST. Cada um tem seu próprio `Suspense` na view
// (mesma promise de `ExecutivoCrossCanalSecao`, sem custo adicional).
export async function ExecutivoHeaderAgenciasStat({
  crossCanalPromise,
}: ExecutivoHeaderStatsProps) {
  const { miniStats } = await crossCanalPromise;
  return <SensitiveValue value={miniStats.agencias} />;
}

// Mesma estrutura de tags do branch mock em `executivo-profile-header.tsx`
// (`<div className="flex items-center gap-2">` envolvendo o valor, depois
// um `<p>` de legenda) — os dois branches (mock/real) e o fallback do
// Suspense abaixo têm que ter o mesmo formato de árvore, senão a troca
// causa erro de hidratação (div vs p na mesma posição).
export async function ExecutivoHeaderVendendo30dStat({
  crossCanalPromise,
}: ExecutivoHeaderStatsProps) {
  const { miniStats } = await crossCanalPromise;
  return (
    <>
      <div className="flex items-center gap-2">
        <p className="text-success text-2xl font-bold">
          <SensitiveValue value={miniStats.vendendo30d} />
        </p>
      </div>
      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        Venderam últimos 30d · <SensitiveValue value={`${miniStats.vendendo30dPct}%`} />
      </p>
    </>
  );
}

// `<span>`, não `Skeleton` (que renderiza um `<div>`) — este fallback vai
// dentro do `<p>` de "Agências" em executivo-profile-header.tsx, e um
// `<div>` dentro de `<p>` é HTML inválido: o navegador fecha a tag `<p>`
// antes da hora, e a árvore final diverge da que o React esperava —
// exatamente a causa de um erro de hidratação visto aqui (2026-08-20).
export function ExecutivoHeaderAgenciasStatSkeleton() {
  return <span className="bg-muted inline-block h-6 w-8 animate-pulse rounded-md align-middle" />;
}

export function ExecutivoHeaderVendendo30dStatSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-10" />
      </div>
      <Skeleton className="mt-1 h-3 w-36" />
    </>
  );
}

// Monta os dois slots (com seu próprio `Suspense`) a partir da mesma
// `crossCanalPromise` — usado pelas 3 páginas do executivo
// (dashboard/agencias/agenda, ver as respectivas page.tsx) pra manter
// "Agências"/"Venderam últimos 30d" com o mesmo número real em qualquer
// aba, já que os 3 lêem o mesmo dado do SST. `agencias/`/`agenda/` pagam
// esse custo (roster + loop de terrestre) só por causa disso — decisão do
// usuário (2026-08-20): os números têm que bater entre as abas, e não dá
// pra calcular "vendendo30d" sem o mesmo roster/loop que `crossCanal` já
// usa. Fica em Suspense (não bloqueia o resto da página) e cacheado por
// `codigoExecutivo` (`comCache`, 10min) — trocar de aba dentro da janela
// de cache não paga o custo de novo.
export function criarExecutivoHeaderStatsSlots(
  crossCanalPromise: ReturnType<typeof executivoDashboardController.obterCrossCanalEMiniStats>,
) {
  return {
    statsAgenciasSlot: (
      <Suspense fallback={<ExecutivoHeaderAgenciasStatSkeleton />}>
        <ExecutivoHeaderAgenciasStat crossCanalPromise={crossCanalPromise} />
      </Suspense>
    ),
    statsVendendo30dSlot: (
      <Suspense fallback={<ExecutivoHeaderVendendo30dStatSkeleton />}>
        <ExecutivoHeaderVendendo30dStat crossCanalPromise={crossCanalPromise} />
      </Suspense>
    ),
  };
}

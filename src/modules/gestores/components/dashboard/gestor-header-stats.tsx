import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingBall } from "@/components/ui/loading-ball";
import type { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";

interface GestorHeaderStatsProps {
  crossCanalPromise: ReturnType<typeof gestorDashboardController.obterCrossCanalAgregado>;
}

// Slots reais (agregado dos executivos via SST) pros stats de topo de
// GestorProfileHeader ("Agências"/"Venderam 30D") — espelha
// executivo-header-stats.tsx. Cada um tem seu próprio Suspense na view
// (mesma promise de GestorSaudeCarteiraSecao, sem custo adicional).
export async function GestorHeaderAgenciasStat({ crossCanalPromise }: GestorHeaderStatsProps) {
  const { miniStats } = await crossCanalPromise;
  return <>{miniStats.agencias}</>;
}

export async function GestorHeaderVendendo30dStat({ crossCanalPromise }: GestorHeaderStatsProps) {
  const { miniStats } = await crossCanalPromise;
  return (
    <>
      <p className="text-success text-xl font-bold">{miniStats.vendendo30d}</p>
      <p className="text-muted-foreground text-center text-[10.5px] font-semibold tracking-wide uppercase">
        Venderam 30D · {`${miniStats.vendendo30dPct}%`}
      </p>
    </>
  );
}

// `LoadingBall` já é um `<span>` (não um `<div>`) — este fallback vai
// dentro do `<p>` de "Agências" em gestor-profile-header.tsx, e um `<div>`
// dentro de `<p>` é HTML inválido (o navegador fecha a tag `<p>` antes da
// hora, divergindo da árvore que o React espera) — mesma causa de erro de
// hidratação já documentada em executivo-header-stats.tsx. Bolinha rosa
// quicando em vez de barra cinza estática (pedido do usuário, 2026-08-26).
export function GestorHeaderAgenciasStatSkeleton() {
  return <LoadingBall size="sm" className="align-middle" />;
}

export function GestorHeaderVendendo30dStatSkeleton() {
  return (
    <>
      <div className="flex h-6 items-center">
        <LoadingBall size="default" />
      </div>
      <Skeleton className="mt-1 h-2.5 w-28" />
    </>
  );
}

// Monta os dois slots (com seu próprio Suspense) a partir da mesma
// crossCanalPromise — usado só pela página de Dashboard (que já paga o
// custo de buscar isso); Executivos/Agências não passam nada e caem no
// fallback mock de GestorProfileHeader.
export function criarGestorHeaderStatsSlots(
  crossCanalPromise: ReturnType<typeof gestorDashboardController.obterCrossCanalAgregado>,
) {
  return {
    statsAgenciasSlot: (
      <Suspense fallback={<GestorHeaderAgenciasStatSkeleton />}>
        <GestorHeaderAgenciasStat crossCanalPromise={crossCanalPromise} />
      </Suspense>
    ),
    statsVendendo30dSlot: (
      <Suspense fallback={<GestorHeaderVendendo30dStatSkeleton />}>
        <GestorHeaderVendendo30dStat crossCanalPromise={crossCanalPromise} />
      </Suspense>
    ),
  };
}

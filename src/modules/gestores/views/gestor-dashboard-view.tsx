import { Suspense } from "react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorHeroKpisSecao } from "@/modules/gestores/components/dashboard/gestor-hero-kpis-secao";
import { GestorSaudeCarteiraSecao } from "@/modules/gestores/components/dashboard/gestor-saude-carteira-secao";
import { GestorTopAgenciasSecao } from "@/modules/gestores/components/dashboard/gestor-top-agencias-secao";
import { criarGestorHeaderStatsSlots } from "@/modules/gestores/components/dashboard/gestor-header-stats";
import { SecaoSkeleton } from "@/modules/gestores/components/dashboard/secao-skeleton";
import { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import { montarGestorApresentacaoMock } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type { GestorPerfil } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorDashboardViewProps {
  perfil: GestorPerfil;
  executivos: ExecutivoComCarteira[];
}

// Encadeia a seção pesada (crossCanal) depois que a rápida (heroKpis)
// resolveu ou falhou — nunca propaga a rejeição de `gate` adiante, só usa
// pra escalonar o timing. Mesmo truque de executivo-dashboard-view.tsx:
// evita disparar todas as chamadas ao SST de uma vez (na escala de N
// executivos, o que seria N vezes mais caro que o Executivo sozinho).
function depoisDe<T>(gate: Promise<unknown>, tarefa: () => Promise<T>): Promise<T> {
  return gate.catch(() => undefined).then(() => tarefa());
}

// Dispara as buscas aqui (não em page.tsx) e passa as promises ainda
// pendentes pros componentes de seção, cada um no seu próprio Suspense —
// a página abre com o header/perfil (já real, sem SST) na hora, hero/kpis
// logo em seguida, e só a seção de saúde da carteira + ranking de
// executivos + Top 10 Agências (as mais caras, dependem de `crossCanal`)
// ficam em skeleton por mais tempo.
//
// "Top 10 Agências" é real desde 2026-08-24 (ver GestorTopAgenciasSecao) —
// depende de `agenciasCarteira` (soma real dos executivos subordinados),
// que só sai depois de `crossCanalPromise` resolver, por isso entrou no
// mesmo Suspense da seção pesada (antes renderizava mock, instantâneo,
// sem Suspense).
export function GestorDashboardView({ perfil, executivos }: GestorDashboardViewProps) {
  const heroKpisPromise = gestorDashboardController.obterHeroKpisAgregado(executivos);
  const crossCanalPromise = depoisDe(heroKpisPromise, () =>
    gestorDashboardController.obterCrossCanalAgregado(executivos),
  );
  const { statsAgenciasSlot, statsVendendo30dSlot } =
    criarGestorHeaderStatsSlots(crossCanalPromise);

  const { atualizadoEm } = montarGestorApresentacaoMock(perfil.id);

  return (
    <GestorDetalheShell
      perfil={perfil}
      abaAtiva="dashboard"
      statsAgenciasSlot={statsAgenciasSlot}
      statsVendendo30dSlot={statsVendendo30dSlot}
    >
      <Suspense fallback={<SecaoSkeleton altura="h-40" />}>
        <GestorHeroKpisSecao
          heroKpisPromise={heroKpisPromise}
          crossCanalPromise={crossCanalPromise}
          atualizadoEm={atualizadoEm}
          executivos={executivos}
        />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SecaoSkeleton altura="h-48" />
            <SecaoSkeleton altura="h-48" />
            <SecaoSkeleton altura="h-48" />
          </div>
        }
      >
        <GestorTopAgenciasSecao crossCanalPromise={crossCanalPromise} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <GestorSaudeCarteiraSecao crossCanalPromise={crossCanalPromise} executivos={executivos} />
      </Suspense>
    </GestorDetalheShell>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle } from "lucide-react";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import { SecaoSkeleton } from "@/modules/atribuicoes/components/executivo/dashboard/secao-skeleton";
import { ExecutivoHeroKpisSecao } from "@/modules/atribuicoes/components/executivo/dashboard/executivo-hero-kpis-secao";
import { ExecutivoSaudeCarteiraSecao } from "@/modules/atribuicoes/components/executivo/dashboard/executivo-saude-carteira-secao";
import { ExecutivoTopAgenciasSecao } from "@/modules/atribuicoes/components/executivo/dashboard/executivo-top-agencias-secao";
import { criarExecutivoHeaderStatsSlots } from "@/modules/atribuicoes/components/executivo/dashboard/executivo-header-stats";
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import type {
  ExecutivoAgenciaResumo,
  ExecutivoPerfil,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoDashboardViewProps {
  perfil: ExecutivoPerfil;
  agencias: ExecutivoAgenciaResumo[];
}

// Encadeia a seção pesada (`crossCanal`) depois que a rápida (`heroKpis`)
// resolveu ou falhou — nunca propaga a rejeição de `gate` adiante, só usa
// pra escalonar o timing. Mesmo truque de dashboard-vendas-view.tsx: evita
// disparar todas as chamadas ao SST de uma vez, que foi a causa da
// lentidão reportada (2026-08-20) — a página esperava as ~2N chamadas do
// loop de terrestre por agência resolverem antes de mostrar até o hero.
function depoisDe<T>(gate: Promise<unknown>, tarefa: () => Promise<T>): Promise<T> {
  return gate.catch(() => undefined).then(() => tarefa());
}

// Dispara as buscas aqui (não em page.tsx) e passa as promises ainda
// pendentes pros componentes de seção, cada um no seu próprio `Suspense` —
// a página abre com o header/perfil (já real, sem SST) na hora, hero/kpis
// logo em seguida, e só a seção de saúde da carteira + Top 10 Agências (as
// mais caras, dependem de `crossCanal`) ficam em skeleton por mais tempo.
// Mesma arquitetura de streaming de dashboard-vendas-view.tsx.
//
// "Top 10 Agências" (SPEC 3.8) é real desde 2026-08-24 (ver
// ExecutivoTopAgenciasSecao/canal-resumo-mock.util.ts) — depende de
// `agenciasCarteira`, que só sai depois de `crossCanalPromise` resolver,
// por isso entrou no mesmo Suspense da seção pesada (antes renderizava
// mock, instantâneo, sem Suspense).
export function ExecutivoDashboardView({ perfil, agencias }: ExecutivoDashboardViewProps) {
  const nomeBase = perfil.bases[0] ? `${perfil.nome} (${perfil.bases[0]})` : perfil.nome;

  const heroKpisPromise = executivoDashboardController.obterHeroKpis(
    perfil.sica,
    perfil.id,
    perfil.totalAgencias,
    agencias,
  );
  const crossCanalPromise = depoisDe(heroKpisPromise, () =>
    executivoDashboardController.obterCrossCanalEMiniStats(
      perfil.sica,
      perfil.id,
      perfil.totalAgencias,
      agencias,
    ),
  );
  const { statsAgenciasSlot, statsVendendo30dSlot } =
    criarExecutivoHeaderStatsSlots(crossCanalPromise);

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-1">
        <nav className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span>Comercial</span>
          <span aria-hidden>›</span>
          <Link href="/crm/executivos" className="hover:text-foreground">
            Executivos
          </Link>
          <span aria-hidden>›</span>
          <span className="text-foreground font-medium">{nomeBase}</span>
        </nav>
        <h1 className="text-foreground text-xl font-semibold">Detalhes do Executivo</h1>
      </div>

      <ExecutivoProfileHeader
        perfil={perfil}
        statsAgenciasSlot={statsAgenciasSlot}
        statsVendendo30dSlot={statsVendendo30dSlot}
      />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva="dashboard" />

      {perfil.sica == null ? (
        <div className="border-warning/40 bg-warning/10 text-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
          <AlertTriangle className="text-warning size-4 shrink-0" />
          <span>
            Executivo sem código SICA vinculado — métricas de venda abaixo não puderam ser
            calculadas a partir de dados reais.
          </span>
        </div>
      ) : null}

      <Suspense fallback={<SecaoSkeleton altura="h-40" />}>
        <ExecutivoHeroKpisSecao
          heroKpisPromise={heroKpisPromise}
          perfilId={perfil.id}
          crossCanalPromise={crossCanalPromise}
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
        <ExecutivoTopAgenciasSecao crossCanalPromise={crossCanalPromise} />
      </Suspense>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <ExecutivoSaudeCarteiraSecao crossCanalPromise={crossCanalPromise} />
      </Suspense>
    </div>
  );
}

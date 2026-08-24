import { Suspense } from "react";
import { Bus, Plane, Trophy } from "lucide-react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorTopAgenciasCard } from "@/modules/gestores/components/dashboard/gestor-top-agencias-card";
import { GestorHeroKpisSecao } from "@/modules/gestores/components/dashboard/gestor-hero-kpis-secao";
import { GestorSaudeCarteiraSecao } from "@/modules/gestores/components/dashboard/gestor-saude-carteira-secao";
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
// executivos (a mais cara) fica em skeleton por mais tempo.
//
// "Top 10 Agências" continua mock de apresentação (paridade com o
// Executivo, ver docs/plano-gestores-backend.md §4.5) e não depende do
// SST — por isso renderiza direto aqui, sem Suspense.
export function GestorDashboardView({ perfil, executivos }: GestorDashboardViewProps) {
  const heroKpisPromise = gestorDashboardController.obterHeroKpisAgregado(executivos, perfil);
  const crossCanalPromise = depoisDe(heroKpisPromise, () =>
    gestorDashboardController.obterCrossCanalAgregado(executivos),
  );
  const { statsAgenciasSlot, statsVendendo30dSlot } =
    criarGestorHeaderStatsSlots(crossCanalPromise);

  const agenciasCarteira = executivos.flatMap((executivo) => executivo.agencias);
  const { atualizadoEm, topAgenciasHoje, topAgenciasHojeAereo, topAgenciasHojeTerrestre } =
    montarGestorApresentacaoMock(perfil.id, agenciasCarteira);

  return (
    <GestorDetalheShell
      perfil={perfil}
      abaAtiva="dashboard"
      statsAgenciasSlot={statsAgenciasSlot}
      statsVendendo30dSlot={statsVendendo30dSlot}
    >
      <Suspense fallback={<SecaoSkeleton altura="h-40" />}>
        <GestorHeroKpisSecao heroKpisPromise={heroKpisPromise} atualizadoEm={atualizadoEm} />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GestorTopAgenciasCard
          icon={Trophy}
          titulo="Top 10 Agências (Hoje)"
          subtitulo="Modalidade: Aéreo + Terrestre"
          itens={topAgenciasHoje}
          iconLinhaTema="rosa"
        />
        <GestorTopAgenciasCard
          icon={Plane}
          titulo="Top 10 Agências Aéreo"
          subtitulo="Modalidade: Aéreo"
          itens={topAgenciasHojeAereo}
          iconLinhaTema="rosa"
        />
        <GestorTopAgenciasCard
          icon={Bus}
          titulo="Top 10 Agências Terrestre"
          subtitulo="Modalidade: Terrestre"
          itens={topAgenciasHojeTerrestre}
          iconLinhaTema="azul"
        />
      </div>

      <Suspense fallback={<SecaoSkeleton altura="h-64" />}>
        <GestorSaudeCarteiraSecao crossCanalPromise={crossCanalPromise} executivos={executivos} />
      </Suspense>
    </GestorDetalheShell>
  );
}

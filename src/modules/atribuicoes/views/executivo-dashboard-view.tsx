"use client";

import Link from "next/link";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import { VendasMesHeroCard } from "@/modules/atribuicoes/components/executivo/dashboard/vendas-mes-hero-card";
import { KpisSecundariosGrid } from "@/modules/atribuicoes/components/executivo/dashboard/kpis-secundarios";
import { MiniStatsGrid } from "@/modules/atribuicoes/components/executivo/dashboard/mini-stats";
import { CrossCanalCard } from "@/modules/atribuicoes/components/executivo/dashboard/cross-canal-card";
import { SaudeCarteiraCard } from "@/modules/atribuicoes/components/executivo/dashboard/saude-carteira-card";
import type { ExecutivoDetalheView } from "@/modules/atribuicoes/types/executivo-detalhe.types";

interface ExecutivoDashboardViewProps {
  detalhe: ExecutivoDetalheView;
}

export function ExecutivoDashboardView({ detalhe }: ExecutivoDashboardViewProps) {
  const { perfil, dashboard } = detalhe;
  const nomeBase = perfil.bases[0] ? `${perfil.nome} (${perfil.bases[0]})` : perfil.nome;

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

      <ExecutivoProfileHeader perfil={perfil} />
      <ExecutivoTabsNav executivoId={perfil.id} abaAtiva="dashboard" />

      <VendasMesHeroCard hero={dashboard.hero} />
      <KpisSecundariosGrid kpis={dashboard.kpis} />
      <MiniStatsGrid miniStats={dashboard.miniStats} />

      <CrossCanalCard crossCanal={dashboard.crossCanal} />
      <SaudeCarteiraCard segmentos={dashboard.saudeCarteira} />
    </div>
  );
}

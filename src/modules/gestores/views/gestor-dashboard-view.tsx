"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorVendasMesHeroCard } from "@/modules/gestores/components/dashboard/gestor-vendas-mes-hero-card";
import { GestorKpisSecundariosGrid } from "@/modules/gestores/components/dashboard/gestor-kpis-secundarios";
import { GestorVendasMensaisChart } from "@/modules/gestores/components/dashboard/gestor-vendas-mensais-chart";
import { GestorTendencia30dChart } from "@/modules/gestores/components/dashboard/gestor-tendencia-30d-chart";
import { GestorCrossCanalCard } from "@/modules/gestores/components/dashboard/gestor-cross-canal-card";
import { GestorSaudeCarteiraCard } from "@/modules/gestores/components/dashboard/gestor-saude-carteira-card";
import { GestorTopAgenciasCard } from "@/modules/gestores/components/dashboard/gestor-top-agencias-card";
import { GestorTopExecutivosCard } from "@/modules/gestores/components/dashboard/gestor-top-executivos-card";
import { GestorAcoesPrioritariasCard } from "@/modules/gestores/components/dashboard/gestor-acoes-prioritarias-card";
import type { GestorDetalheView } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorDashboardViewProps {
  detalhe: GestorDetalheView;
}

export function GestorDashboardView({ detalhe }: GestorDashboardViewProps) {
  const { perfil, dashboard } = detalhe;
  const ano = new Date().getFullYear();
  const agenciasHref = `/crm/gestores/${perfil.id}/agencias`;

  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="dashboard">
      <GestorVendasMesHeroCard hero={dashboard.hero} />
      <GestorKpisSecundariosGrid kpis={dashboard.kpis} />

      <GestorVendasMensaisChart
        dados={dashboard.vendasMensais}
        totalAno={dashboard.vendasMensaisTotalAno}
        nacionalPct={dashboard.vendasMensaisNacionalPct}
        internacionalPct={dashboard.vendasMensaisInternacionalPct}
        ano={ano}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GestorTendencia30dChart
          valores={dashboard.tendencia30d}
          total={dashboard.tendencia30dTotal}
        />
        <GestorCrossCanalCard crossCanal={dashboard.crossCanal} />
      </div>

      <GestorSaudeCarteiraCard segmentos={dashboard.saudeCarteira} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GestorTopAgenciasCard
          titulo="Top agências — mês"
          ranking={dashboard.topAgenciasMes}
          verTodasHref={agenciasHref}
        />
        <GestorTopAgenciasCard
          titulo="Top agências — ano"
          ranking={dashboard.topAgenciasAno}
          verTodasHref={agenciasHref}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GestorTopExecutivosCard
          titulo="Top 5 executivos — melhor saúde"
          subtitulo="% agências vendendo nos últimos 30 dias"
          icon={TrendingUp}
          iconClassName="text-success"
          ranking={dashboard.topExecutivosMelhorSaude}
          corBarra="bg-success"
        />
        <GestorTopExecutivosCard
          titulo="5 executivos — atenção"
          subtitulo="Carteiras com menor % de agências vendendo"
          icon={TrendingDown}
          iconClassName="text-destructive"
          ranking={dashboard.topExecutivosAtencao}
          corBarra="bg-destructive"
        />
      </div>

      <GestorAcoesPrioritariasCard
        paradasComHistorico={dashboard.acoesPrioritarias.paradasComHistorico}
        emQueda={dashboard.acoesPrioritarias.emQueda}
        verListaCompletaHref={agenciasHref}
      />
    </GestorDetalheShell>
  );
}

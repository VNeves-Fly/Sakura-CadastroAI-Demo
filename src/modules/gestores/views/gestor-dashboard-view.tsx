"use client";

import { TrendingUp, TrendingDown, Bus, Plane, Trophy } from "lucide-react";
import { GestorDetalheShell } from "@/modules/gestores/components/gestor-detalhe-shell";
import { GestorReceitaTotalCard } from "@/modules/gestores/components/dashboard/gestor-receita-total-card";
import { GestorKpisSecundariosGrid } from "@/modules/gestores/components/dashboard/gestor-kpis-secundarios";
import { GestorTopAgenciasCard } from "@/modules/gestores/components/dashboard/gestor-top-agencias-card";
import { GestorTopExecutivosCard } from "@/modules/gestores/components/dashboard/gestor-top-executivos-card";
import { GestorSaudeCarteiraCard } from "@/modules/gestores/components/dashboard/gestor-saude-carteira-card";
import type { GestorDetalheView } from "@/modules/gestores/types/gestor-detalhe.types";

interface GestorDashboardViewProps {
  detalhe: GestorDetalheView;
}

export function GestorDashboardView({ detalhe }: GestorDashboardViewProps) {
  const { perfil, dashboard } = detalhe;

  return (
    <GestorDetalheShell perfil={perfil} abaAtiva="dashboard">
      <GestorReceitaTotalCard
        hero={dashboard.hero}
        canalAereo={dashboard.canalAereo}
        canalTerrestre={dashboard.canalTerrestre}
        atualizadoEm={dashboard.atualizadoEm}
      />

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

      <GestorKpisSecundariosGrid kpis={dashboard.kpis} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GestorTopAgenciasCard
          icon={Trophy}
          titulo="Top 10 Agências (Hoje)"
          subtitulo="Modalidade: Aéreo + Terrestre"
          itens={dashboard.topAgenciasHoje}
          iconLinhaTema="rosa"
        />
        <GestorTopAgenciasCard
          icon={Plane}
          titulo="Top 10 Agências Aéreo"
          subtitulo="Modalidade: Aéreo"
          itens={dashboard.topAgenciasHojeAereo}
          iconLinhaTema="rosa"
        />
        <GestorTopAgenciasCard
          icon={Bus}
          titulo="Top 10 Agências Terrestre"
          subtitulo="Modalidade: Terrestre"
          itens={dashboard.topAgenciasHojeTerrestre}
          iconLinhaTema="azul"
        />
      </div>

      <GestorSaudeCarteiraCard segmentos={dashboard.saudeCarteira} />
    </GestorDetalheShell>
  );
}

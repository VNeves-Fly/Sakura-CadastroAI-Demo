"use client";

import Link from "next/link";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExecutivoProfileHeader } from "@/modules/atribuicoes/components/executivo/executivo-profile-header";
import { ExecutivoTabsNav } from "@/modules/atribuicoes/components/executivo/executivo-tabs-nav";
import { VendasMesHeroCard } from "@/modules/atribuicoes/components/executivo/dashboard/vendas-mes-hero-card";
import { KpisSecundariosGrid } from "@/modules/atribuicoes/components/executivo/dashboard/kpis-secundarios";
import { MiniStatsGrid } from "@/modules/atribuicoes/components/executivo/dashboard/mini-stats";
import { Tendencia30dChart } from "@/modules/atribuicoes/components/executivo/dashboard/tendencia-30d-chart";
import { CrossCanalCard } from "@/modules/atribuicoes/components/executivo/dashboard/cross-canal-card";
import { SaudeCarteiraCard } from "@/modules/atribuicoes/components/executivo/dashboard/saude-carteira-card";
import { TopAgenciasCard } from "@/modules/atribuicoes/components/executivo/dashboard/top-agencias-card";
import { RiscoCollapsivel } from "@/modules/atribuicoes/components/executivo/dashboard/risco-collapsivel";
import { SortableDataTable } from "@/modules/shared/components/sortable-data-table";
import { SensitiveValue } from "@/modules/shared/components/sensitive-value";
import { formatarMoedaAbreviada } from "@/modules/atribuicoes/utils/formatar-moeda.util";
import type { ExecutivoDetalheView } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type {
  AgenciaRisco,
  AgenciaEmQueda,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

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

      <Tendencia30dChart valores={dashboard.tendencia30d} total={dashboard.tendencia30dTotal} />

      <CrossCanalCard crossCanal={dashboard.crossCanal} />
      <SaudeCarteiraCard segmentos={dashboard.saudeCarteira} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopAgenciasCard titulo="Top 20 agências (mês)" ranking={dashboard.topAgenciasMes} />
        <TopAgenciasCard titulo="Top 20 agências (ano)" ranking={dashboard.topAgenciasAno} />
      </div>

      <RiscoCollapsivel
        icon={<AlertTriangle className="text-warning size-4 shrink-0" />}
        titulo="Precisam de atenção — Paradas com histórico de compra — priorizar visita/contato"
        contador={dashboard.paradasComHistorico.length}
      >
        <TabelaParadas linhas={dashboard.paradasComHistorico} />
      </RiscoCollapsivel>

      <RiscoCollapsivel
        icon={<TrendingDown className="text-destructive size-4 shrink-0" />}
        titulo="Em queda — Ritmo atual a 40% abaixo da média mensal (12m)"
        contador={dashboard.emQueda.length}
      >
        <TabelaEmQueda linhas={dashboard.emQueda} />
      </RiscoCollapsivel>
    </div>
  );
}

function TabelaParadas({ linhas }: { linhas: AgenciaRisco[] }) {
  return (
    <SortableDataTable
      columns={[
        {
          key: "nome",
          label: "Agência",
          render: (linha) => (
            <div className="flex flex-col">
              <span className="text-foreground font-medium">{linha.nome}</span>
              <span className="text-muted-foreground font-mono text-xs">{linha.cnpj}</span>
            </div>
          ),
        },
        {
          key: "volume365d",
          label: "Volume 365d",
          align: "right",
          render: (linha) => <SensitiveValue value={formatarMoedaAbreviada(linha.volume365d)} />,
        },
        {
          key: "diasSemComprar",
          label: "Sem comprar",
          align: "right",
          render: (linha) => (
            <Badge variant={linha.diasSemComprar > 150 ? "destructive" : "outline"}>
              {linha.diasSemComprar}d
            </Badge>
          ),
        },
      ]}
      rows={linhas}
      rowKey={(linha) => linha.cnpj}
      emptyMessage="Nenhuma agência parada com histórico de compra."
    />
  );
}

function TabelaEmQueda({ linhas }: { linhas: AgenciaEmQueda[] }) {
  return (
    <SortableDataTable
      columns={[
        {
          key: "nome",
          label: "Agência",
          render: (linha) => <span className="text-foreground font-medium">{linha.nome}</span>,
        },
        {
          key: "mediaMensal12m",
          label: "Média mensal (12m)",
          align: "right",
          render: (linha) => (
            <SensitiveValue value={formatarMoedaAbreviada(linha.mediaMensal12m)} />
          ),
        },
        {
          key: "vendasAtual",
          label: "Vendas atual",
          align: "right",
          render: (linha) => <SensitiveValue value={formatarMoedaAbreviada(linha.vendasAtual)} />,
        },
        {
          key: "quedaPct",
          label: "Queda %",
          align: "right",
          render: (linha) => (
            <span className="text-destructive font-medium">-{linha.quedaPct}%</span>
          ),
        },
      ]}
      rows={linhas}
      rowKey={(linha) => linha.nome}
      emptyMessage="Nenhuma agência em queda no período."
    />
  );
}

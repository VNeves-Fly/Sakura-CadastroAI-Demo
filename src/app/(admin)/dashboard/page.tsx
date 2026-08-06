import { Inbox, Bot, FileEdit, CheckCircle2 } from "lucide-react";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { DashboardKpiCard } from "@/modules/admin/components/dashboard-kpi-card";
import { SlaPorEtapaCard } from "@/modules/admin/components/sla-por-etapa-card";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { UltimasMovimentacoesList } from "@/modules/admin/components/ultimas-movimentacoes-list";

// Cores reaproveitadas do painel de /cadastros (mesma linguagem visual por
// status): rosa = entrada, roxo = IA, teal = etapa do analista, verde =
// ativo.
const COR_ENTRADA = "#F60F9E";
const COR_IA = "#8A2BE2";
const COR_COMPLEMENTAR = "#008B8B";
const COR_ATIVO = "#008000";

// Mesma janela usada pra "Novos cadastros" e pro breakdown IA x analista
// de contratos gerados (ver ObterMetricasDashboardUseCase/
// ObterAnaliseContratosUseCase) — decisão do usuário, 2026-08-06.
const DIAS_JANELA = 30;

// Dado real (ver ObterMetricasDashboardUseCase, ObterKpisCadastroUseCase e
// ObterAnaliseContratosUseCase, já existente) — antes desta página era só
// front-end mockado (literais fixos, sem nenhuma query).
export default async function DashboardPage() {
  const [metricas, kpis, analiseContratos] = await Promise.all([
    cadastroAdminController.obterMetricasDashboard(),
    cadastroAdminController.obterKpisCadastro(),
    cadastroAdminController.obterAnaliseContratos(DIAS_JANELA),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          icon={Inbox}
          titulo="Novos cadastros"
          valor={String(metricas.novosCadastros30Dias)}
          descricao="nos últimos 30 dias"
          cor={COR_ENTRADA}
        />
        <DashboardKpiCard
          icon={Bot}
          titulo="Contratos IA"
          valor={String(analiseContratos.porOrigem.ia)}
          descricao="gerados pela IA nos últimos 30 dias"
          cor={COR_IA}
        />
        <DashboardKpiCard
          icon={FileEdit}
          titulo="Em complementar"
          valor={String(kpis.emComplementar)}
          descricao="cadastros parados em complementar"
          cor={COR_COMPLEMENTAR}
        />
        <DashboardKpiCard
          icon={CheckCircle2}
          titulo="Ativas"
          valor={String(kpis.ativas)}
          descricao="agências liberadas e operando"
          cor={COR_ATIVO}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SlaPorEtapaCard itens={metricas.slaPorEtapa} />
        <GraficoOrigemContrato
          ia={analiseContratos.porOrigem.ia}
          humano={analiseContratos.porOrigem.humano}
        />
      </div>

      <UltimasMovimentacoesList itens={metricas.ultimasMovimentacoes} />
    </div>
  );
}

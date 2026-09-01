import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { DashboardKpisGrid } from "@/modules/admin/components/dashboard-kpis-grid";
import { SlaPorEtapaCard } from "@/modules/admin/components/sla-por-etapa-card";
import { GraficoOrigemContrato } from "@/modules/admin/components/grafico-origem-contrato";
import { UltimasMovimentacoesList } from "@/modules/admin/components/ultimas-movimentacoes-list";

// Mesma janela usada pro breakdown IA x analista de contratos gerados (ver
// ObterAnaliseContratosUseCase) — decisão do usuário, 2026-08-06.
const DIAS_JANELA = 30;

// Dado real (ver ObterMetricasDashboardUseCase, ObterKpisCadastroUseCase e
// ObterAnaliseContratosUseCase, já existente). Movida de /dashboard pra cá
// em 2026-09-01 (fica junto da área de cadastros no menu) — ver
// src/app/(admin)/dashboard/page.tsx, que agora só redireciona.
export default async function DashboardPage() {
  const [metricas, kpis, analiseContratos] = await Promise.all([
    cadastroAdminController.obterMetricasDashboard(),
    cadastroAdminController.obterKpisCadastro(),
    cadastroAdminController.obterAnaliseContratos(DIAS_JANELA),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>

      <DashboardKpisGrid
        emComplementarPorInfoPendente={kpis.emComplementarPorInfoPendente}
        seriesNovosCadastros={metricas.seriesNovosCadastros}
        seriesContratosIa={metricas.seriesContratosIa}
        seriesEmComplementar={metricas.seriesEmComplementar}
        seriesAtivas={metricas.seriesAtivas}
      />

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

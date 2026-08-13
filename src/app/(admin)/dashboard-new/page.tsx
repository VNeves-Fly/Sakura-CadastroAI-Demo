import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import { DashboardVendasView } from "@/modules/dashboard-vendas/components/dashboard-vendas-view";

// Reprodução da página "Dashboard" do CRM Sakura (SPEC_Dashboard_Sakura.md)
// dentro do shell existente deste projeto — sidebar/header reais, só o
// conteúdo é novo. Dados 100% mock (ver dashboard-vendas.mock-service.ts):
// não existe base de vendas aéreas/terrestres aqui ainda.
export default async function DashboardNewPage() {
  const dados = await dashboardVendasController.obterDashboard();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>
      <DashboardVendasView dados={dados} />
    </div>
  );
}

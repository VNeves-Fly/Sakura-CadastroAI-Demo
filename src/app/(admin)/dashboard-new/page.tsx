import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { dashboardVendasController } from "@/modules/dashboard-vendas/presentation/controllers/dashboard-vendas.controller";
import { DashboardVendasView } from "@/modules/dashboard-vendas/components/dashboard-vendas-view";

// Página com dados mock de vendas — restrita a ADMIN (pedido do
// usuário, 2026-08-13), mesmo padrão de guard usado em bases/page.tsx e
// gestores/page.tsx (nunca só esconder o item do menu: sem isto, dava
// pra acessar direto pela URL).
const CARGOS_COM_ACESSO = new Set(["ADMIN"]);

// Reprodução da página "Dashboard" do CRM Sakura (SPEC_Dashboard_Sakura.md)
// dentro do shell existente deste projeto — sidebar/header reais, só o
// conteúdo é novo. Dados 100% mock (ver dashboard-vendas.mock-service.ts):
// não existe base de vendas aéreas/terrestres aqui ainda.
export default async function DashboardNewPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await dashboardVendasController.obterDashboard();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>
      <DashboardVendasView dados={dados} />
    </div>
  );
}

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
// dentro do shell existente deste projeto — sidebar/header reais. Ver
// docs/faltante.md pra saber quais seções já são dado real (via SST) e
// quais ainda são mock.
//
// Só busca aqui as duas partes rápidas (`resumoEDia`/`mockEstatico`) — as
// 4 seções pesadas (que fazem paginação no SST) são buscadas dentro de
// `DashboardVendasView`, cada uma no seu próprio `Suspense`, pra não
// bloquear a página inteira no pior caso (~30s a frio).
export default async function DashboardNewPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const [resumoEDia, mockEstatico] = await Promise.all([
    dashboardVendasController.obterResumoEDia(),
    dashboardVendasController.obterMockEstatico(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard</h1>
      <DashboardVendasView resumoEDia={resumoEDia} mockEstatico={mockEstatico} />
    </div>
  );
}

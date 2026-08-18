import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
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
// Todo o resto que depende do SST — inclusive `resumoEDia`, que antes
// era buscado aqui e bloqueava a página inteira — é buscado dentro de
// `DashboardVendasView`, cada seção no seu próprio `Suspense`, pra a
// página abrir na hora com tudo em placeholder.
//
// `obterMockEstatico` (intraday/acurácia) não é mais chamado aqui —
// alimentava só "Vendas Intraday" e "Acurácia da projeção", ocultas a
// pedido do usuário (2026-08-18, ver dashboard-vendas-view.tsx). Pra
// trazer de volta: `const mockEstatico = await
// dashboardVendasController.obterMockEstatico()` + prop `mockEstatico`
// em `DashboardVendasView`.
export default async function DashboardCrmPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-xl font-bold">Dashboard CRM</h1>
      <DashboardVendasView />
    </div>
  );
}

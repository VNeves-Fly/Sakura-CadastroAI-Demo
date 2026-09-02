import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";

// Embed do CRM (financeiro/analise) — restrito a ADMIN (pedido do usuário,
// 2026-09-02), mesmo padrão de guard de "Dashboard CRM"/"Fast View".
const CARGOS_COM_ACESSO = new Set(["ADMIN"]);

const URL_ANALISE_DE_RISCO =
  "https://crm.flysakura.com/admin/financeiro/analise?hideSidebar=true&hideHeader=true";

export default async function AnaliseDeRiscoPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return (
    // -m-6 cancela o padding do <main> do layout admin (ver (admin)/layout.tsx)
    // pra o iframe ocupar o corpo inteiro, sem faixa de conteúdo ao redor.
    <div className="-m-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]">
      <iframe
        src={URL_ANALISE_DE_RISCO}
        title="Análise de Risco"
        className="block h-full w-full border-0"
      />
    </div>
  );
}

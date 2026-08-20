import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { tvController } from "@/modules/tv/presentation/controllers/tv.controller";
import { TvView } from "@/modules/tv/components/tv-view";

// "Fast View" — reprodução da página /tv do CRM Sakura original
// (spectvsakura.md), dados 100% mock por enquanto (mesmo estágio
// inicial do Dashboard CRM). Mesmo guard de acesso do Dashboard CRM
// (pedido do usuário, 2026-08-13) — reaproveitado aqui por ser o mesmo
// tipo de painel executivo de vendas.
const CARGOS_COM_ACESSO = new Set(["ADMIN"]);

export default async function TvPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await tvController.obterDados();

  return <TvView dados={dados} />;
}

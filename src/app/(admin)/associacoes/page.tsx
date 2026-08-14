import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { AssociacoesView } from "@/modules/associacoes/views/associacoes-view";

const CARGOS_GESTAO_DE_ASSOCIACOES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function AssociacoesPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_ASSOCIACOES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return <AssociacoesView />;
}

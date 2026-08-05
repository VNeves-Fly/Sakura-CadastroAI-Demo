import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { AssociacaoEditView } from "@/modules/associacoes/views/associacao-edit-view";

const CARGOS_GESTAO_DE_ASSOCIACOES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function AssociacaoEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_ASSOCIACOES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return <AssociacaoEditView id={params.id} />;
}

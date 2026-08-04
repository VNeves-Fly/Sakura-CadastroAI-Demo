import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { GestorEditView } from "@/modules/gestores/views/gestor-edit-view";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestorEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return <GestorEditView id={params.id} />;
}

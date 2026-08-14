import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { BaseEditView } from "@/modules/bases/views/base-edit-view";

const CARGOS_GESTAO_DE_BASES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function BaseEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_BASES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return <BaseEditView id={params.id} />;
}

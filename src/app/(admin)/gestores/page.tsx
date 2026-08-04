import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { GestoresView } from "@/modules/gestores/views/gestores-view";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestoresPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  return <GestoresView />;
}

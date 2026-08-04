import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { PromotoresView } from "@/modules/atribuicoes/views/promotores-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function PromotoresPage() {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  const gestoresOptions =
    cargo === "GESTOR"
      ? null
      : (await atribuicoesAdminController.listarGestores()).map((gestor) => ({
          id: gestor.id,
          nome: gestor.nome,
        }));

  return <PromotoresView gestoresOptions={gestoresOptions} />;
}

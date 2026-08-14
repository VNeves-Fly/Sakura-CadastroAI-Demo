import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { PromotorCreateView } from "@/modules/atribuicoes/views/promotor-create-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function NovoExecutivoPage() {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  const todasBases = await basesController.list();

  const gestoresOptions =
    cargo === "GESTOR"
      ? null
      : (await atribuicoesAdminController.listarGestores()).map((gestor) => ({
          id: gestor.id,
          nome: gestor.nome,
          bases: gestor.bases,
        }));

  const minhasBasesSiglas =
    cargo === "GESTOR" && session?.user?.id
      ? ((await atribuicoesAdminController.buscarGestorPorUserId(session.user.id))?.bases ?? [])
      : undefined;

  return (
    <PromotorCreateView
      gestoresOptions={gestoresOptions}
      minhasBasesSiglas={minhasBasesSiglas}
      todasBases={todasBases}
    />
  );
}

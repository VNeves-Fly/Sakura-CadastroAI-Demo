import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { PromotoresView } from "@/modules/atribuicoes/views/promotores-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function PromotoresPage() {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  // Lista de gestores só pra exibir o nome na coluna GESTOR da tabela — ao
  // contrário do formulário de cadastro (/executivos/novo), aqui não há
  // restrição por cargo: é leitura, não seleção de vínculo.
  const [gestoresRaw, todasBases] = await Promise.all([
    atribuicoesAdminController.listarGestores(),
    basesController.list(),
  ]);
  const gestoresOptions = gestoresRaw.map((gestor) => ({
    id: gestor.id,
    nome: gestor.nome,
    bases: gestor.bases,
  }));

  return <PromotoresView gestoresOptions={gestoresOptions} todasBases={todasBases} />;
}

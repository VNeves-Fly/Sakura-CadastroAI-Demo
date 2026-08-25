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

  // Lista de gestores pra exibir o nome na coluna GESTOR da tabela — é
  // leitura, não seleção de vínculo, então não tem restrição por cargo.
  const [gestoresRaw, todasBases] = await Promise.all([
    atribuicoesAdminController.listarGestores(),
    basesController.list(),
  ]);
  const gestoresOptions = gestoresRaw.map((gestor) => ({
    id: gestor.id,
    nome: gestor.nome,
    bases: gestor.bases,
  }));

  // Opções pro seletor "Gestor" do modal de cadastro (ex-/executivos/novo,
  // migrado pra modal — padronização pedida pelo usuário, 2026-08-25): aqui
  // sim há restrição por cargo — Gestor não escolhe, o vínculo já é o dele.
  const criacaoGestoresOptions = cargo === "GESTOR" ? null : gestoresOptions;
  const minhasBasesSiglas =
    cargo === "GESTOR" && session?.user?.id
      ? ((await atribuicoesAdminController.buscarGestorPorUserId(session.user.id))?.bases ?? [])
      : undefined;

  return (
    <PromotoresView
      gestoresOptions={gestoresOptions}
      criacaoGestoresOptions={criacaoGestoresOptions}
      minhasBasesSiglas={minhasBasesSiglas}
      todasBases={todasBases}
    />
  );
}

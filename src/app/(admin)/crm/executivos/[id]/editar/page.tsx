import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { PromotorEditView } from "@/modules/atribuicoes/views/promotor-edit-view";
import { buscarExecutivoMockPorId, MOCK_GESTORES } from "@/modules/crm-mock/pessoas.mock-data";
import { BASES_MOCK } from "@/modules/crm-mock/agencias.mock-data";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { PromotorCrudView } from "@/modules/atribuicoes/types/promotor-crud.types";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Demo: catálogo fixo de bases (mesmas siglas usadas em crm-mock/agencias.mock-data)
// no lugar de basesController.list() — esta tela não lê mais do banco.
const TODAS_BASES_MOCK: BaseView[] = BASES_MOCK.map(([sigla, cidadeUf], indice) => {
  const [nomeCidade, uf] = cidadeUf.split("/");
  return {
    id: `base-${sigla.toLowerCase()}-${indice}`,
    sigla,
    nomeCidade: nomeCidade ?? cidadeUf,
    uf: uf ?? "",
  };
});

export default async function PromotorEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  const executivoMock = buscarExecutivoMockPorId(params.id);
  if (!executivoMock) {
    notFound();
  }

  const promotor: PromotorCrudView = {
    id: executivoMock.id,
    nome: executivoMock.nome,
    sica: executivoMock.sica,
    email: executivoMock.email,
    telefone: executivoMock.telefone,
    gestorId: executivoMock.gestorId,
    bases: executivoMock.bases,
    temAcesso: executivoMock.temAcesso,
  };

  const todasBases = TODAS_BASES_MOCK;

  const gestoresOptions =
    cargo === "GESTOR"
      ? null
      : MOCK_GESTORES.map((gestor) => ({
          id: gestor.id,
          nome: gestor.nome,
          bases: gestor.bases,
        }));

  const minhasBasesSiglas =
    cargo === "GESTOR" && session?.user?.id
      ? (MOCK_GESTORES.find((gestor) => gestor.userId === session.user.id)?.bases ?? [])
      : undefined;

  return (
    <PromotorEditView
      id={params.id}
      promotor={promotor}
      gestoresOptions={gestoresOptions}
      minhasBasesSiglas={minhasBasesSiglas}
      todasBases={todasBases}
    />
  );
}

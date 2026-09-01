import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { GestorEditView } from "@/modules/gestores/views/gestor-edit-view";
import { buscarGestorMockPorId } from "@/modules/crm-mock/pessoas.mock-data";
import { BASES_MOCK } from "@/modules/crm-mock/agencias.mock-data";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { GestorView } from "@/modules/gestores/types/gestor.types";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

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

export default async function GestorEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const gestorMock = buscarGestorMockPorId(params.id);
  if (!gestorMock) {
    notFound();
  }

  const gestor: GestorView = {
    id: gestorMock.id,
    nome: gestorMock.nome,
    sica: gestorMock.sica,
    email: gestorMock.email,
    telefone: gestorMock.telefone,
    temAcesso: gestorMock.temAcesso,
    bases: gestorMock.bases,
    createdAt: gestorMock.createdAt.toISOString(),
  };

  const basesOptions = TODAS_BASES_MOCK;

  return <GestorEditView id={params.id} gestor={gestor} basesOptions={basesOptions} />;
}

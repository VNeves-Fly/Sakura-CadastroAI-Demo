import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import {
  listarAgenciasMockDoExecutivo,
  mapAgencia,
  montarExecutivoPerfil,
} from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import { ExecutivoDashboardView } from "@/modules/atribuicoes/views/executivo-dashboard-view";
import { buscarExecutivoMockPorId, MOCK_GESTORES } from "@/modules/crm-mock/pessoas.mock-data";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function ExecutivoDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  // Dados fictícios (demo): nunca lê do Postgres real, ver
  // crm-mock/pessoas.mock-data.ts / crm-mock/agencias.mock-data.ts.
  const promotor = buscarExecutivoMockPorId(params.id);
  if (!promotor) notFound();

  const gestores = MOCK_GESTORES;
  const agencias = listarAgenciasMockDoExecutivo(promotor.nome);
  const gestoresPorId = new Map(
    gestores.map((gestor) => [
      gestor.id,
      { id: gestor.id, nome: gestor.nome, bases: gestor.bases },
    ]),
  );

  const perfil = montarExecutivoPerfil(promotor.toJSON(), gestoresPorId, agencias);

  // Busca do dashboard (SST) disparada dentro de `ExecutivoDashboardView`,
  // não aqui — a página não espera por ela, só por `perfil`/`agencias`
  // (banco próprio, rápido). Ver comentário em executivo-dashboard-view.tsx.
  return <ExecutivoDashboardView perfil={perfil} agencias={agencias.map(mapAgencia)} />;
}

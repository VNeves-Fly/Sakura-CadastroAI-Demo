import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import {
  mapAgencia,
  montarExecutivoPerfil,
} from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import { executivoDashboardController } from "@/modules/atribuicoes/presentation/controllers/executivo-dashboard.controller";
import { ExecutivoDashboardView } from "@/modules/atribuicoes/views/executivo-dashboard-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function ExecutivoDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  const promotor = await atribuicoesAdminController.buscarPromotorPorId(params.id);
  if (!promotor) notFound();

  const [gestores, agencias] = await Promise.all([
    atribuicoesAdminController.listarGestores(),
    atribuicoesAdminController.listarAgenciasPorPromotor(params.id),
  ]);
  const gestoresPorId = new Map(
    gestores.map((gestor) => [
      gestor.id,
      { id: gestor.id, nome: gestor.nome, bases: gestor.bases },
    ]),
  );

  const perfil = montarExecutivoPerfil(promotor.toJSON(), gestoresPorId, agencias);
  const { dashboard } = await executivoDashboardController.obterDashboard(
    perfil.sica,
    perfil.id,
    perfil.totalAgencias,
    agencias.map(mapAgencia),
  );

  return <ExecutivoDashboardView detalhe={{ perfil, dashboard }} />;
}

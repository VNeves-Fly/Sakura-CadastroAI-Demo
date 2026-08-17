import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { montarExecutivoDetalheView } from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
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

  const detalhe = montarExecutivoDetalheView(promotor.toJSON(), gestoresPorId, agencias);

  return <ExecutivoDashboardView detalhe={detalhe} />;
}

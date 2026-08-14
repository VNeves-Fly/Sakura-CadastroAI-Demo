import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import {
  mapAgencia,
  montarExecutivoDetalheView,
} from "@/modules/atribuicoes/adapters/executivo-detalhe.adapter";
import { ExecutivoAgenciasView } from "@/modules/atribuicoes/views/executivo-agencias-view";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function ExecutivoAgenciasPage({ params }: { params: { id: string } }) {
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

  const { perfil } = montarExecutivoDetalheView(promotor.toJSON(), gestoresPorId, agencias);
  const agenciasReais = agencias.map(mapAgencia);

  return <ExecutivoAgenciasView perfil={perfil} agenciasReais={agenciasReais} />;
}

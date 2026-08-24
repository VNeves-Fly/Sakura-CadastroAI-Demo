import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { carregarGestorComExecutivos } from "@/modules/gestores/services/gestor-detalhe.loader";
import { montarGestorPerfil } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
import { gestorExecutivosTabAdapter } from "@/modules/gestores/adapters/gestor-executivos-tab.adapter";
import { GestorExecutivosView } from "@/modules/gestores/views/gestor-executivos-view";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestorExecutivosPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await carregarGestorComExecutivos(params.id);
  if (!dados) {
    notFound();
  }

  const perfil = montarGestorPerfil(dados.gestor, dados.executivos);
  const agregado = await gestorDashboardController.obterAgregadoCompleto(dados.executivos, perfil);
  const executivos = gestorExecutivosTabAdapter.toViewList(dados.executivos, agregado.porExecutivo);

  return <GestorExecutivosView perfil={perfil} executivos={executivos} />;
}

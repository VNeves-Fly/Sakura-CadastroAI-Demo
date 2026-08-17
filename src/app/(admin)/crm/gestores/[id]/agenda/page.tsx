import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { carregarGestorComExecutivos } from "@/modules/gestores/services/gestor-detalhe.loader";
import { montarGestorPerfil } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import { GestorAgendaView } from "@/modules/gestores/views/gestor-agenda-view";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestorAgendaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await carregarGestorComExecutivos(params.id);
  if (!dados) {
    notFound();
  }

  const perfil = montarGestorPerfil(dados.gestor, dados.executivos);

  return <GestorAgendaView perfil={perfil} executivos={dados.executivos} />;
}

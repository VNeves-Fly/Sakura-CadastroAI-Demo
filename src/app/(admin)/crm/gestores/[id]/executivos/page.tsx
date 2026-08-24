import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { carregarGestorComExecutivos } from "@/modules/gestores/services/gestor-detalhe.loader";
import { montarGestorPerfil } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import { gestorDashboardController } from "@/modules/gestores/presentation/controllers/gestor-dashboard.controller";
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
  // Não awaita aqui: dispara a busca pesada (SST por executivo) e repassa
  // a promise pendente pra view, que a resolve dentro de um Suspense — a
  // tela (shell + tabs) abre na hora do clique, a tabela chega depois.
  const agregadoPromise = gestorDashboardController.obterAgregadoCompleto(dados.executivos, perfil);

  return (
    <GestorExecutivosView
      perfil={perfil}
      executivosBase={dados.executivos}
      agregadoPromise={agregadoPromise}
    />
  );
}

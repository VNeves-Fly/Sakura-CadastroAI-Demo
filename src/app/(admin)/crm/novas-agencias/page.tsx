import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { novasAgenciasController } from "@/modules/novas-agencias/presentation/controllers/novas-agencias.controller";
import { NovasAgenciasView } from "@/modules/novas-agencias/views/novas-agencias-view";

// Mesmo guard de /crm/agencias — análise executiva, restrita a
// ADMIN/Diretor (nunca só esconder do menu: sem isto, dava pra acessar
// direto pela URL).
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function NovasAgenciasPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await novasAgenciasController.obterNovasAgencias();
  // Calculado no servidor (não no client component) pra não dar mismatch
  // de hidratação — é só "quando esta página foi carregada", não um dado
  // de sincronização real (não existe cron por trás desta tela).
  const carregadoEm = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return <NovasAgenciasView dados={dados} carregadoEm={carregadoEm} />;
}

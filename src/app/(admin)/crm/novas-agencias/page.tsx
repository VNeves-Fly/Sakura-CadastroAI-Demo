import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { novasAgenciasController } from "@/modules/novas-agencias/presentation/controllers/novas-agencias.controller";
import { NovasAgenciasView } from "@/modules/novas-agencias/views/novas-agencias-view";

// Mesmo guard de /crm/agencias — análise executiva, restrita a
// ADMIN/Diretor (nunca só esconder do menu: sem isto, dava pra acessar
// direto pela URL).
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Reprodução 1:1 (só front-end) da tela "Análise de Novas Agências" —
// SPEC recebida do usuário (2026-08-18), sem nenhuma lógica de backend
// real: todo o dado vem de novas-agencias.mock-service.ts (arrays em
// memória). Sidebar/header reais deste projeto, não os da SPEC.
export default async function NovasAgenciasPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const dados = await novasAgenciasController.obterNovasAgencias();

  return <NovasAgenciasView dados={dados} />;
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { carregarAgenciasCarteira } from "@/modules/agencias-crm/services/agencia-carteira.loader";
import { AgenciasListaView } from "@/modules/agencias-crm/views/agencias-lista-view";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function AgenciasCrmPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const agencias = await carregarAgenciasCarteira();

  // Texto informativo estático (SPEC "Financial Adapter — Atualizado em
  // ...") — reflete o momento da carga da página, não uma sincronização
  // real (não existe job de sync pra essa listagem hoje).
  const atualizadoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return <AgenciasListaView agencias={agencias} atualizadoEm={atualizadoEm} />;
}

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { montarAgenciaDetalheViewMock } from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";
import { AgenciaDetalheView } from "@/modules/agencias-crm/views/agencia-detalhe-view";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Página de detalhe da Agência (/crm/agencias/[id]) — repositório de
// DEMONSTRAÇÃO: nunca chama o SST nem o Postgres local. O `:id` é sempre
// o id de uma das 25 identidades fictícias canônicas de
// crm-mock/agencias.mock-data.ts (mesma fonte da listagem /crm/agencias);
// `montarAgenciaDetalheViewMock` retorna `null` pra id inexistente, o que
// cai no not-found.tsx normal do Next.
export default async function AgenciaDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  const view = montarAgenciaDetalheViewMock(params.id);
  if (!view) {
    notFound();
  }

  return <AgenciaDetalheView detalhe={view} />;
}

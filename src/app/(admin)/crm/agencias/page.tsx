import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { carregarAgenciasCarteira } from "@/modules/agencias-crm/services/agencia-carteira.loader";
import { AgenciasListaSecao } from "@/modules/agencias-crm/components/agencias-lista-secao";
import { AgenciasListaSkeleton } from "@/modules/agencias-crm/components/agencias-lista-skeleton";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function AgenciasCrmPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // Disparado sem `await` — a página abre com o skeleton na hora (ver
  // AgenciasListaSkeleton) em vez de esperar o banco local + as métricas
  // reais do SST (que, em cache frio, podem levar dezenas de segundos —
  // ver agencia-carteira.sst-service.ts); o Suspense abaixo troca pro
  // conteúdo real assim que a promise resolver.
  const agenciasPromise = carregarAgenciasCarteira();

  // Texto informativo estático (SPEC "Financial Adapter — Atualizado em
  // ...") — reflete o momento da carga da página, não uma sincronização
  // real (não existe job de sync pra essa listagem hoje).
  const atualizadoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <Suspense fallback={<AgenciasListaSkeleton />}>
      <AgenciasListaSecao agenciasPromise={agenciasPromise} atualizadoEm={atualizadoEm} />
    </Suspense>
  );
}

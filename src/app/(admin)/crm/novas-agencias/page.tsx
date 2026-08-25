import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { novasAgenciasController } from "@/modules/novas-agencias/presentation/controllers/novas-agencias.controller";
import { NovasAgenciasSecao } from "@/modules/novas-agencias/components/novas-agencias-secao";
import { NovasAgenciasSkeleton } from "@/modules/novas-agencias/components/novas-agencias-skeleton";

// Mesmo guard de /crm/agencias — análise executiva, restrita a
// ADMIN/Diretor (nunca só esconder do menu: sem isto, dava pra acessar
// direto pela URL).
const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function NovasAgenciasPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // Disparado sem `await` — a página abre com o skeleton na hora (ver
  // NovasAgenciasSkeleton) em vez de esperar o banco local + as métricas
  // reais do SST (que, em cache frio, podem levar dezenas de segundos —
  // ver agencia-carteira.sst-service.ts); mesmo padrão de
  // /crm/agencias/page.tsx. O Suspense abaixo troca pro conteúdo real
  // assim que a promise resolver.
  const dadosPromise = novasAgenciasController.obterNovasAgencias();

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

  return (
    <Suspense fallback={<NovasAgenciasSkeleton />}>
      <NovasAgenciasSecao dadosPromise={dadosPromise} carregadoEm={carregadoEm} />
    </Suspense>
  );
}

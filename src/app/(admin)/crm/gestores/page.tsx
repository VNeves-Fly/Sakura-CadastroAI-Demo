import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { calcularVendasPorGestor } from "@/modules/gestores/services/vendas-por-gestor.loader";
import { GestoresListaSecao } from "@/modules/gestores/components/gestores-lista-secao";
import { GestoresListaSkeleton } from "@/modules/gestores/components/gestores-lista-skeleton";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function GestoresPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // Banco local (Prisma) — rápido, mantido com `await` bloqueante mesmo:
  // a lista de gestores em si depende disso de qualquer forma.
  const [basesOptions, promotores] = await Promise.all([
    basesController.list(),
    atribuicoesAdminController.listarPromotores(),
  ]);

  // Coluna "Executivos" da lista é dado real — contagem de Promotor.gestorId
  // apontando pra cada gestor (não existe agregação pronta pra isso ainda,
  // ver src/modules/atribuicoes/domain/entities/promotor.entity.ts).
  const executivosPorGestor: Record<string, number> = {};
  for (const promotor of promotores) {
    const gestorId = promotor.gestorId;
    if (!gestorId) continue;
    executivosPorGestor[gestorId] = (executivosPorGestor[gestorId] ?? 0) + 1;
  }

  // Disparado sem `await` — a página abre com o skeleton na hora (ver
  // GestoresListaSkeleton) em vez de esperar até dezenas de chamadas ao
  // SST (uma por promotor, ver vendas-por-gestor.loader.ts) resolverem; o
  // Suspense abaixo troca pro conteúdo real assim que a promise resolver.
  const vendasPorGestorPromise = calcularVendasPorGestor(promotores);

  return (
    <Suspense fallback={<GestoresListaSkeleton />}>
      <GestoresListaSecao
        basesOptions={basesOptions}
        executivosPorGestor={executivosPorGestor}
        vendasPorGestorPromise={vendasPorGestorPromise}
      />
    </Suspense>
  );
}

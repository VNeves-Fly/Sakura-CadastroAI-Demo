import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { calcularVendasPorGestor } from "@/modules/gestores/services/vendas-por-gestor.loader";
import { GestoresListaSecao } from "@/modules/gestores/components/gestores-lista-secao";
import { GestoresListaSkeleton } from "@/modules/gestores/components/gestores-lista-skeleton";
import { MOCK_EXECUTIVOS, MOCK_GESTORES } from "@/modules/crm-mock/pessoas.mock-data";
import { BASES_MOCK } from "@/modules/crm-mock/agencias.mock-data";
import type { BaseView } from "@/modules/bases/types/base.types";
import type { RawGestorResponse } from "@/modules/gestores/services/gestores.service";

const CARGOS_GESTAO_DE_GESTORES = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Deriva as opções de base direto das siglas fictícias em BASES_MOCK — este
// repositório é uma demonstração e não deve consultar a tabela `Base` real
// (ver crm-mock/agencias.mock-data.ts).
const MOCK_BASES: BaseView[] = BASES_MOCK.map(([sigla, cidadeUf]) => {
  const [nomeCidade, uf] = cidadeUf.split("/");
  return {
    id: `base-${sigla.toLowerCase()}`,
    sigla,
    nomeCidade: nomeCidade ?? cidadeUf,
    uf: uf ?? "",
  };
});

export default async function GestoresPage() {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_GESTAO_DE_GESTORES.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // Dados fictícios (demo): nunca lê do Postgres real, ver
  // crm-mock/pessoas.mock-data.ts.
  const basesOptions = MOCK_BASES;
  const promotores = MOCK_EXECUTIVOS;
  const gestoresRaw: RawGestorResponse[] = MOCK_GESTORES.map((gestor) => gestor.toJSON());

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
        gestoresRaw={gestoresRaw}
      />
    </Suspense>
  );
}

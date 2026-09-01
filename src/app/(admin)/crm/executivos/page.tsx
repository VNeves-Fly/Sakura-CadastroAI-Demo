import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { calcularVendasPorExecutivos } from "@/modules/atribuicoes/services/vendas-por-executivos.loader";
import { PromotoresListaSecao } from "@/modules/atribuicoes/components/promotores-lista-secao";
import { PromotoresListaSkeleton } from "@/modules/atribuicoes/components/promotores-lista-skeleton";
import { MOCK_EXECUTIVOS, MOCK_GESTORES } from "@/modules/crm-mock/pessoas.mock-data";
import { BASES_MOCK } from "@/modules/crm-mock/agencias.mock-data";
import type { BaseView } from "@/modules/bases/types/base.types";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Deriva as opções de base (select do modal de cadastro) direto das siglas
// fictícias em BASES_MOCK — este repositório é uma demonstração e não deve
// consultar a tabela `Base` real (ver crm-mock/agencias.mock-data.ts).
const MOCK_BASES: BaseView[] = BASES_MOCK.map(([sigla, cidadeUf]) => {
  const [nomeCidade, uf] = cidadeUf.split("/");
  return {
    id: `base-${sigla.toLowerCase()}`,
    sigla,
    nomeCidade: nomeCidade ?? cidadeUf,
    uf: uf ?? "",
  };
});

export default async function PromotoresPage() {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  // Lista de gestores pra exibir o nome na coluna GESTOR da tabela — é
  // leitura, não seleção de vínculo, então não tem restrição por cargo.
  // Dados fictícios (demo): nunca lê do Postgres real, ver
  // crm-mock/pessoas.mock-data.ts.
  const gestoresRaw = MOCK_GESTORES;
  const todasBases = MOCK_BASES;
  const promotoresTodos = MOCK_EXECUTIVOS;
  const gestorAtual =
    cargo === "GESTOR" && session?.user?.id
      ? (MOCK_GESTORES.find((gestor) => gestor.userId === session.user.id) ?? null)
      : null;
  const gestoresOptions = gestoresRaw.map((gestor) => ({
    id: gestor.id,
    nome: gestor.nome,
    bases: gestor.bases,
  }));

  // Mesmo escopo de resolverAcessoPromotores em promotores.routes.ts:
  // Gestor só enxerga os próprios executivos. Antes desse SSR, isso era
  // garantido pelo filtro em listPromotoresRoute (comparando
  // promotor.gestorId); replicado aqui pra não vazar dado de outros
  // gestores pro carregamento inicial.
  const promotores =
    cargo === "GESTOR"
      ? promotoresTodos.filter((promotor) => promotor.gestorId === gestorAtual?.id)
      : promotoresTodos;

  // Opções pro seletor "Gestor" do modal de cadastro (ex-/executivos/novo,
  // migrado pra modal — padronização pedida pelo usuário, 2026-08-25): aqui
  // sim há restrição por cargo — Gestor não escolhe, o vínculo já é o dele.
  const criacaoGestoresOptions = cargo === "GESTOR" ? null : gestoresOptions;
  const minhasBasesSiglas = cargo === "GESTOR" ? (gestorAtual?.bases ?? []) : undefined;

  // Disparado sem `await` — a página abre com o skeleton na hora em vez de
  // esperar o fan-out de SST (uma chamada por promotor, pode levar dezenas
  // de segundos a frio); o Suspense abaixo troca pro conteúdo real assim
  // que a promise resolver. Mesmo padrão de /crm/gestores (ver
  // vendas-por-gestor.loader.ts).
  const vendasPorExecutivoPromise = calcularVendasPorExecutivos(promotores);

  return (
    <Suspense fallback={<PromotoresListaSkeleton />}>
      <PromotoresListaSecao
        promotores={promotores}
        gestoresOptions={gestoresOptions}
        criacaoGestoresOptions={criacaoGestoresOptions}
        minhasBasesSiglas={minhasBasesSiglas}
        todasBases={todasBases}
        vendasPorExecutivoPromise={vendasPorExecutivoPromise}
      />
    </Suspense>
  );
}

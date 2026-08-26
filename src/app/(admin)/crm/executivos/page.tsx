import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { calcularVendasPorExecutivos } from "@/modules/atribuicoes/services/vendas-por-executivos.loader";
import { PromotoresListaSecao } from "@/modules/atribuicoes/components/promotores-lista-secao";
import { PromotoresListaSkeleton } from "@/modules/atribuicoes/components/promotores-lista-skeleton";

const CARGOS_ADMIN = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

export default async function PromotoresPage() {
  const session = await getServerSession(nextAuthOptions);
  const cargo = session?.user.cargo;

  if (!cargo || (cargo !== "GESTOR" && !CARGOS_ADMIN.has(cargo))) {
    redirect("/cadastros");
  }

  // Lista de gestores pra exibir o nome na coluna GESTOR da tabela — é
  // leitura, não seleção de vínculo, então não tem restrição por cargo.
  // `promotoresTodos` (banco local, rápido) já vem aqui também — antes só
  // era buscado no fetch client de /api/promotores, que travava a tabela
  // inteira esperando o fan-out de SST junto (ver docs/otimizacao-tempo.md).
  const [gestoresRaw, todasBases, promotoresTodos, gestorAtual] = await Promise.all([
    atribuicoesAdminController.listarGestores(),
    basesController.list(),
    atribuicoesAdminController.listarPromotores(),
    cargo === "GESTOR" && session?.user?.id
      ? atribuicoesAdminController.buscarGestorPorUserId(session.user.id)
      : Promise.resolve(null),
  ]);
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

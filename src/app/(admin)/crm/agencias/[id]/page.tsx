import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { montarAgenciaDetalheView } from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";
import { AgenciaDetalheView } from "@/modules/agencias-crm/views/agencia-detalhe-view";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { AgenciaDetalhe } from "@/modules/cadastro/domain/repositories/agencia-repository";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Página de detalhe da Agência (/crm/agencias/[id]) — mesmo esqueleto de
// /crm/executivos/[id] e /crm/gestores/[id] (guard → controller → notFound
// → Promise.all pra dado relacionado → adapter → View). Reaproveita o
// mesmo motor real de /cadastros/:id (obterDetalhe/obterDadosReceita) que
// antes alimentava a API /api/agencias-crm/:id do modal — a rota interna
// foi removida junto com o modal, essa página busca direto via
// controller, sem round-trip HTTP (mesmo padrão de Executivo/Gestor).
export default async function AgenciaDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    redirect("/cadastros");
  }

  // `obterDetalhe` lança NotFoundError pra id inexistente (não retorna
  // null — diferente de buscarPromotorPorId/Gestor usado em Executivo/
  // Gestor); sem este catch, um id inválido (ex.: linha mock em
  // /crm/agencias) derrubava a página inteira com um erro não tratado em
  // vez de cair no not-found.tsx normal do Next (bug reportado pelo
  // usuário, 2026-08-21).
  let detalhe: AgenciaDetalhe;
  try {
    detalhe = await cadastroAdminController.obterDetalhe(params.id);
  } catch (erro) {
    if (erro instanceof NotFoundError) notFound();
    throw erro;
  }

  const [dadosReceita, promotores, gestores] = await Promise.all([
    cadastroAdminController.obterDadosReceita(params.id).catch(() => null),
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarGestores(),
  ]);

  const executivo = detalhe.agencia.executivoId
    ? (promotores.find((promotor) => promotor.id === detalhe.agencia.executivoId) ?? null)
    : null;

  const gestorNome = executivo?.gestorId
    ? (gestores.find((gestor) => gestor.id === executivo.gestorId)?.nome ?? null)
    : null;

  const view = montarAgenciaDetalheView(detalhe, dadosReceita, {
    base: executivo?.bases[0] ?? null,
    gestorNome,
  });

  return <AgenciaDetalheView detalhe={view} />;
}

import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/modules/auth/presentation/routes/next-auth.options";
import { httpError, httpOk } from "@/modules/shared/presentation/http-response";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { montarAgenciaDetalheView } from "@/modules/agencias-crm/adapters/agencia-detalhe.adapter";

const CARGOS_COM_ACESSO = new Set(["ADMIN", "DIRETOR_ANALISTA"]);

// Detalhe sob demanda pro modal de Agências (SPEC_AGENCIAS_SAKURA.md,
// seção 4) — chamado client-side quando uma linha da listagem é clicada
// (ver use-agencia-detalhe.view-model.ts). Reaproveita o mesmo motor real
// de /cadastros/:id (obterDetalhe/obterDadosReceita), só monta a view
// comercial (real + mock) por cima.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(nextAuthOptions);
  if (!session || !CARGOS_COM_ACESSO.has(session.user.cargo)) {
    return httpError("Acesso não permitido.", 403);
  }

  const detalhe = await cadastroAdminController.obterDetalhe(params.id);
  if (!detalhe) {
    return httpError("Agência não encontrada.", 404);
  }

  const [dadosReceita, promotores] = await Promise.all([
    cadastroAdminController.obterDadosReceita(params.id).catch(() => null),
    atribuicoesAdminController.listarPromotores(),
  ]);

  const executivo = detalhe.agencia.executivoId
    ? (promotores.find((promotor) => promotor.id === detalhe.agencia.executivoId) ?? null)
    : null;

  const gestorNome = executivo?.gestorId
    ? ((await atribuicoesAdminController.listarGestores()).find(
        (gestor) => gestor.id === executivo.gestorId,
      )?.nome ?? null)
    : null;

  const view = montarAgenciaDetalheView(detalhe, dadosReceita, {
    base: executivo?.bases[0] ?? null,
    gestorNome,
  });

  return httpOk(view);
}

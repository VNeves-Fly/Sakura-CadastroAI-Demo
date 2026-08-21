import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import {
  montarAgenciasCarteiraViewList,
  type ExecutivoResumo,
} from "@/modules/agencias-crm/adapters/agencia-carteira.adapter";
import { regiaoPorUf } from "@/modules/agencias-crm/utils/regiao-por-uf.util";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

// Carrega a carteira inteira de agências (real, via o mesmo motor de
// /cadastros) e monta a view comercial (real + mock) — server-side.
//
// Nota de escala: `todos: true` traz TODAS as agências de uma vez (sem
// paginação no banco), e o resto do filtro/ordenação/paginação acontece em
// memória no client (mesmo padrão já usado em atribuicoesAdminController.
// listarPromotores() nos módulos Executivos/Gestores). Isso é adequado pro
// volume de dado deste ambiente hoje; se a base crescer pra dezenas de
// milhares de agências (a SPEC cita ~20 mil), essa listagem precisa migrar
// pra paginação real no banco, como /cadastros já faz.
//
// `status: ["ativo", "recusado"]` é explícito de propósito — sem isso,
// ListarCadastrosUseCase aplica o próprio default (só os 5 status "em
// andamento" da fila de cadastro: em_analise/em_complementar/aguardando_*),
// que EXCLUI justamente ativo/recusado — os dois únicos status que as
// abas Ativas/Inativas desta listagem mostram (ver use-agencias-carteira.
// view-model.ts). Bug encontrado em 2026-08-21 revisando o design: a
// listagem nunca populava com dado real porque nenhuma agência em
// andamento bate com nenhuma das duas abas.
export async function carregarAgenciasCarteira(): Promise<AgenciaCarteiraView[]> {
  const [{ items }, promotores, bases] = await Promise.all([
    cadastroAdminController.listarCadastros({ todos: true, status: ["ativo", "recusado"] }),
    atribuicoesAdminController.listarPromotores(),
    basesController.list(),
  ]);

  const executivoPorId = new Map<string, ExecutivoResumo>(
    promotores.map((promotor) => [promotor.id, { nome: promotor.nome, bases: promotor.bases }]),
  );

  const regiaoPorBase = new Map<string, string | null>(
    bases.map((base) => [base.sigla, regiaoPorUf(base.uf)]),
  );

  const itensBrutos = items.map(({ agencia, executivoNome, executivoGestor }) => ({
    id: agencia.id,
    razaoSocial: agencia.razaoSocial,
    cnpj: agencia.cnpj,
    status: agencia.status,
    createdAt: agencia.createdAt,
    executivoId: agencia.executivoId,
    executivoNome,
    executivoGestor,
    sicaCodigo: agencia.sicaCodigo,
  }));

  return montarAgenciasCarteiraViewList(itensBrutos, executivoPorId, regiaoPorBase);
}

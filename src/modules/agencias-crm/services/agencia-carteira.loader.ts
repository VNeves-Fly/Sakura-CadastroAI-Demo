import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import {
  montarAgenciasCarteiraViewList,
  type ExecutivoResumo,
} from "@/modules/agencias-crm/adapters/agencia-carteira.adapter";
import { regiaoPorUf } from "@/modules/agencias-crm/utils/regiao-por-uf.util";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import {
  agenciaCarteiraSstService,
  type MetricasCarteiraSst,
} from "@/modules/agencias-crm/services/agencia-carteira.sst-service";
import type { AgenciaCarteiraView } from "@/modules/agencias-crm/types/agencia-carteira.types";

// Sem SST_API_KEY, ou se a chamada falhar, a listagem inteira segue
// 100% mock (comportamento idêntico ao de antes desta integração) — não
// derruba a página por causa do SST, mesmo padrão de comFallback usado
// dentro de agencia-carteira.sst-service.ts, só que numa granularidade
// maior (a seção inteira "métricas reais", não sub-seções).
async function obterMetricasReaisOuNull(): Promise<Map<string, MetricasCarteiraSst> | null> {
  if (!usaSstReal()) return null;
  try {
    return await agenciaCarteiraSstService.obterMetricasCarteira();
  } catch (erro) {
    console.error(
      "[agencias-crm] Falha ao buscar métricas reais do SST — listagem segue 100% mock.",
      erro,
    );
    return null;
  }
}

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
export async function carregarAgenciasCarteira(): Promise<AgenciaCarteiraView[]> {
  const [{ items }, promotores, bases, metricasReaisPorSica] = await Promise.all([
    cadastroAdminController.listarCadastros({ todos: true }),
    atribuicoesAdminController.listarPromotores(),
    basesController.list(),
    obterMetricasReaisOuNull(),
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

  return montarAgenciasCarteiraViewList(
    itensBrutos,
    executivoPorId,
    regiaoPorBase,
    metricasReaisPorSica,
  );
}

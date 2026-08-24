import { atribuicoesAdminController } from "@/modules/atribuicoes/presentation/controllers/atribuicoes-admin.controller";
import { basesController } from "@/modules/bases/presentation/controllers/bases.controller";
import { cadastroAdminController } from "@/modules/cadastro/presentation/controllers/cadastro-admin.controller";
import {
  STATUS_EM_ANALISE,
  STATUS_EM_COMPLEMENTAR,
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_ATIVACAO,
  STATUS_ATIVO,
  STATUS_RECUSADO,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import {
  montarAgenciasCarteiraViewList,
  montarAgenciasCarteiraViewListLocal,
  type ExecutivoResumo,
} from "@/modules/agencias-crm/adapters/agencia-carteira.adapter";
import { regiaoPorUf } from "@/modules/agencias-crm/utils/regiao-por-uf.util";
import { usaSstReal } from "@/modules/agencias-crm/infrastructure/agencia-sst-client.util";
import {
  agenciaCarteiraSstService,
  type AgenciaRosterSst,
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

// Sem SST_API_KEY, ou se a chamada ao roster falhar, a listagem fica
// vazia — não existe fonte alternativa de identidade de agência pra
// fabricar linhas mock (mesmo critério já usado pra `agenciasCarteira`
// em executivo-dashboard.sst-service.ts quando o roster falha).
async function obterRosterOuVazio(): Promise<AgenciaRosterSst[]> {
  if (!usaSstReal()) return [];
  try {
    return await agenciaCarteiraSstService.obterRosterCompleto();
  } catch (erro) {
    console.error("[agencias-crm] Falha ao buscar roster completo do SST — listagem vazia.", erro);
    return [];
  }
}

// Fallback local (sem SST_API_KEY configurada — ambiente de dev) — usa as
// agências reais do funil de cadastro/onboarding deste app (tabela
// `Agencia` via Prisma, `cadastroAdminController.listarCadastros`) só pra
// a listagem não vir vazia. Nunca roda quando a chave está configurada —
// comportamento com SST real inalterado (decisão do usuário, 2026-08-21).
// Pedido do usuário, 2026-08-24: "usar nosso banco local" em vez de ficar
// bloqueado esperando a chave do SST.
async function carregarAgenciasLocais(
  promotorPorId: Map<string, ExecutivoResumo>,
  regiaoPorBase: Map<string, string | null>,
): Promise<AgenciaCarteiraView[]> {
  // `listarCadastros` sem `status` explícito exclui ativo/recusado por
  // padrão (é o comportamento certo pras "filas de trabalho" de
  // /cadastros, ver ListarCadastrosUseCase) — aqui a listagem é a
  // carteira inteira (Ativas/Inativas já é a própria aba desta tela),
  // então precisa pedir todos os status manualmente.
  const { items } = await cadastroAdminController.listarCadastros({
    todos: true,
    status: [
      STATUS_EM_ANALISE,
      STATUS_EM_COMPLEMENTAR,
      STATUS_AGUARDANDO_ASSINATURA,
      STATUS_AGUARDANDO_VALIDACAO,
      STATUS_AGUARDANDO_CADASTRAMENTO,
      STATUS_AGUARDANDO_ATIVACAO,
      STATUS_ATIVO,
      STATUS_RECUSADO,
    ],
  });
  return montarAgenciasCarteiraViewListLocal(
    items.map(({ agencia, executivoNome, executivoGestor }) => ({
      id: agencia.id,
      razaoSocial: agencia.razaoSocial,
      cnpj: agencia.cnpj,
      status: agencia.status,
      executivoId: agencia.executivoId,
      executivoNome,
      gestorNome: executivoGestor,
    })),
    promotorPorId,
    regiaoPorBase,
  );
}

// Carrega a carteira inteira de agências — real, via o roster comercial
// do SST (identidade/status/executivo), não via a tabela `Agencia` deste
// app (funil de cadastro/onboarding, conceito diferente — decisão do
// usuário, 2026-08-21) — EXCETO quando SST_API_KEY não está configurada,
// caso em que cai no fallback local acima (ver carregarAgenciasLocais).
// Gestor/base/executivoId são melhor esforço, resolvidos localmente via
// Promotor.sica (roster SST) ou Promotor.id (fallback local) — única
// hierarquia Executivo→Gestor que existe, nem SST nem `Agencia` conhecem
// Gestor diretamente.
export async function carregarAgenciasCarteira(): Promise<AgenciaCarteiraView[]> {
  const [promotores, gestores, bases] = await Promise.all([
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarGestores(),
    basesController.list(),
  ]);

  const gestorNomePorId = new Map(gestores.map((gestor) => [gestor.id, gestor.nome]));

  const regiaoPorBase = new Map<string, string | null>(
    bases.map((base) => [base.sigla, regiaoPorUf(base.uf)]),
  );

  if (!usaSstReal()) {
    const promotorPorId = new Map<string, ExecutivoResumo>(
      promotores.map((promotor) => [
        promotor.id,
        {
          id: promotor.id,
          nome: promotor.nome,
          bases: promotor.bases,
          gestorNome: promotor.gestorId ? (gestorNomePorId.get(promotor.gestorId) ?? null) : null,
        },
      ]),
    );
    return carregarAgenciasLocais(promotorPorId, regiaoPorBase);
  }

  const promotorPorSica = new Map<number, ExecutivoResumo>(
    promotores
      .filter((promotor) => promotor.sica !== null)
      .map((promotor) => [
        promotor.sica as number,
        {
          id: promotor.id,
          nome: promotor.nome,
          bases: promotor.bases,
          gestorNome: promotor.gestorId ? (gestorNomePorId.get(promotor.gestorId) ?? null) : null,
        },
      ]),
  );

  const [roster, metricasReaisPorSica] = await Promise.all([
    obterRosterOuVazio(),
    obterMetricasReaisOuNull(),
  ]);

  return montarAgenciasCarteiraViewList(
    roster,
    promotorPorSica,
    regiaoPorBase,
    metricasReaisPorSica,
  );
}

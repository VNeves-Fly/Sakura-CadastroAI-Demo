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

// Carrega a carteira inteira de agências — real, via o roster comercial
// do SST (identidade/status/executivo), não via a tabela `Agencia` deste
// app (funil de cadastro/onboarding, conceito diferente — decisão do
// usuário, 2026-08-21). Gestor/base/executivoId são melhor esforço,
// resolvidos localmente via Promotor.sica (única hierarquia
// Executivo→Gestor que existe, o SST não conhece Gestor).
export async function carregarAgenciasCarteira(): Promise<AgenciaCarteiraView[]> {
  const [roster, promotores, gestores, bases, metricasReaisPorSica] = await Promise.all([
    obterRosterOuVazio(),
    atribuicoesAdminController.listarPromotores(),
    atribuicoesAdminController.listarGestores(),
    basesController.list(),
    obterMetricasReaisOuNull(),
  ]);

  const gestorNomePorId = new Map(gestores.map((gestor) => [gestor.id, gestor.nome]));

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

  const regiaoPorBase = new Map<string, string | null>(
    bases.map((base) => [base.sigla, regiaoPorUf(base.uf)]),
  );

  return montarAgenciasCarteiraViewList(
    roster,
    promotorPorSica,
    regiaoPorBase,
    metricasReaisPorSica,
  );
}

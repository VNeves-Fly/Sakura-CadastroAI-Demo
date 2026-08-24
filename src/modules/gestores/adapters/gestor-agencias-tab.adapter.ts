import { hashParaNumero } from "@/modules/shared/utils/hash-deterministico.util";
import { unmaskCnpj } from "@/modules/cadastro/utils/cnpj.util";
import {
  categoriaPorVendas,
  limiteMock,
} from "@/modules/atribuicoes/adapters/executivo-agencias.adapter";
import type { AgenciaCarteiraResumo } from "@/modules/atribuicoes/types/executivo-detalhe.types";
import type { ExecutivoComCarteira } from "@/modules/gestores/adapters/gestor-detalhe.adapter";
import type {
  AgenciaDaGestaoView,
  FaixaRecencia,
  PeriodoVendas,
} from "@/modules/gestores/types/gestor-agencias-tab.types";

const STATUS_DADOS_FALTANTES = new Set(["em_analise", "em_complementar"]);

function faixaRecenciaMock(dias: number): FaixaRecencia {
  if (dias <= 30) return "ate30d";
  if (dias <= 90) return "30a90d";
  if (dias <= 365) return "90a365d";
  return "semVenda365d";
}

// Fallback determinístico de sempre (hash por id local) — usado quando o
// executivo dono não tem SICA ou a agência ainda não sincronizou no SST,
// pra não mostrar zero/vazio numa linha da tabela.
function gerarCamposMockAgencia(agenciaId: string) {
  const seed = hashParaNumero(agenciaId);
  const vendasAno = ((seed % 900) + 20) * 10_000;
  return {
    categoria: categoriaPorVendas(vendasAno),
    vendasAno,
    bilhetesAno: 20 + (seed % 400),
    faixaRecencia: faixaRecenciaMock(seed % 400),
    limite: ((seed % 900) + 20) * 12_000,
  };
}

// `porExecutivo` vem de gestorDashboardController.obterAgregadoCompleto(...)
// — 1 item por executivo, cada um com seu próprio `agenciasCarteira`
// (roster real daquele executivo, ou [] se ele não tem SICA/o SST falhou).
// O join com a agência local é por CNPJ normalizado (unmaskCnpj), isolado
// por executivo — uma mesma agência não deveria aparecer em dois rosters,
// mas isolar por executivo evita esse risco por construção.
export function montarAgenciasDaGestaoViewListReal(
  executivos: ExecutivoComCarteira[],
  porExecutivo: Array<{ id: string; agenciasCarteira: AgenciaCarteiraResumo[] }>,
): AgenciaDaGestaoView[] {
  const carteiraPorExecutivoId = new Map(porExecutivo.map((p) => [p.id, p.agenciasCarteira]));

  return executivos.flatMap((executivo) => {
    const rosterPorCnpj = new Map(
      (carteiraPorExecutivoId.get(executivo.id) ?? []).map((sst) => [unmaskCnpj(sst.cnpj), sst]),
    );

    return executivo.agencias.map((agencia): AgenciaDaGestaoView => {
      const base = {
        id: agencia.id,
        nome: agencia.razaoSocial,
        cnpj: agencia.cnpj,
        executivoId: executivo.id,
        executivoNome: executivo.nome,
        base: executivo.bases[0] ?? null,
        status: agencia.status,
        dadosFaltantes: STATUS_DADOS_FALTANTES.has(agencia.status),
        inativada: agencia.status === "recusado",
      };

      const sst = rosterPorCnpj.get(unmaskCnpj(agencia.cnpj));
      if (!sst) {
        return { ...base, ...gerarCamposMockAgencia(agencia.id) };
      }

      return {
        ...base,
        categoria: categoriaPorVendas(sst.vendasAno),
        vendasAno: sst.vendasAno,
        bilhetesAno: sst.bilhetesAno,
        faixaRecencia: sst.faixaRecencia,
        limite: limiteMock(sst.codigo),
      };
    });
  });
}

// Fração do ano atribuída a cada período — mesma aproximação de
// executivo-agencias.adapter.ts.
const FRACAO_POR_PERIODO: Record<PeriodoVendas, number> = {
  mes: 1 / 12,
  "30d": 1 / 12,
  "90d": 1 / 4,
  ano: 1,
};

export function valorNoPeriodo(
  agencia: AgenciaDaGestaoView,
  periodo: PeriodoVendas,
): { vendas: number; bilhetes: number; ticketMedio: number } {
  const fracao = FRACAO_POR_PERIODO[periodo];
  const vendas = Math.round(agencia.vendasAno * fracao);
  const bilhetes = Math.max(0, Math.round(agencia.bilhetesAno * fracao));
  const ticketMedio = bilhetes > 0 ? Math.round(vendas / bilhetes) : 0;
  return { vendas, bilhetes, ticketMedio };
}

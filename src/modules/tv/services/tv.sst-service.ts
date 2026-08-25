import {
  requireSstApiKey,
  sstBaseUrl,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";
import { valkeyGet, valkeySet } from "@/modules/dashboard-vendas/infrastructure/valkey-cache.util";
import { shareAereoVazio, top10Vazio, vendasECanaisVazio } from "@/modules/tv/utils/tv-vazio.util";
import type {
  CanalTv,
  CompanhiaShareTv,
  PeriodoTv,
  Top10LinhaTv,
  TvData,
} from "@/modules/tv/types/tv.types";

// Integração real com o SST (sst.flysakura.com) — mesmo padrão de
// sstGet/comCache/comFallback já usado em agencias-crm/dashboard-vendas/
// atribuicoes (bounded contexts isolados por decisão deliberada do
// projeto, cada módulo mantém sua própria cópia). `vendas`/`aereo`/
// `terrestre` vêm do mesmo /api/consolidado/overview que já alimenta o
// Dashboard CRM — mesma fonte oficial (confirmado no SPEC_TV.md do
// usuário: "mesma [fonte] do BI e da TV"). `shareAereo`/`top10*` vêm de
// dois endpoints que este projeto nunca tinha chamado antes de hoje
// (/api/consolidado/vendas-por-companhia e /api/consolidado/
// top-clientes) — testados ao vivo em 2026-08-24 (ver
// docs/plano-fastview-backend.md, seção 4), respondem exatamente como o
// SPEC_TV.md documenta.

const TTL_CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { expiraEm: number; valor: unknown }>();

async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const cacheado = cache.get(chave);
  if (cacheado && cacheado.expiraEm > Date.now()) {
    return cacheado.valor as T;
  }

  const doValkey = await valkeyGet<T>(chave);
  if (doValkey !== undefined) {
    cache.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor: doValkey });
    return doValkey;
  }

  const valor = await buscar();
  cache.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor });
  await valkeySet(chave, valor, TTL_CACHE_MS / 1000);
  return valor;
}

// Retry só em 5xx/timeout (transiente, vale tentar de novo), nunca em
// 4xx (erro nosso de parâmetro) — mesmo critério dos 3 services-irmão.
// Timeout explícito (achado em agencia-sst-client.util.ts): sem ele, uma
// chamada travada no SST pendura a promise pra sempre.
const TENTATIVAS_5XX = 3;
const TIMEOUT_MS = 20_000;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sstGet<T>(
  caminho: string,
  parametros: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(caminho, sstBaseUrl());
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }

  for (let tentativa = 0; ; tentativa++) {
    const controlador = new AbortController();
    const timeoutId = setTimeout(() => controlador.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "X-Internal-Secret": requireSstApiKey() },
        signal: controlador.signal,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const corpo = await response.text();
      if (response.status < 500 || tentativa >= TENTATIVAS_5XX) {
        throw new Error(`SST respondeu ${response.status}: ${corpo}`);
      }
    } catch (erro) {
      const ehTimeoutOuRede = erro instanceof Error && erro.name === "AbortError";
      if (!ehTimeoutOuRede || tentativa >= TENTATIVAS_5XX) throw erro;
    } finally {
      clearTimeout(timeoutId);
    }

    await esperar(300 * (tentativa + 1));
  }
}

// Degrada um bloco pro mock em vez de derrubar a página inteira — mesmo
// padrão dos 3 services-irmão.
async function comFallback<T>(rotulo: string, tarefa: Promise<T>, valorMock: T): Promise<T> {
  try {
    return await tarefa;
  } catch (erro) {
    console.error(`[tv] "${rotulo}" falhou contra o SST — usando mock só nesta seção.`, erro);
    return valorMock;
  }
}

function formatarDataIsoBrasilia(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function hojeIso(): string {
  return formatarDataIsoBrasilia(new Date());
}

function ontemIso(): string {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  return formatarDataIsoBrasilia(ontem);
}

function inicioMesIso(): string {
  const [ano, mes] = hojeIso().split("-");
  return `${ano}-${mes}-01`;
}

function inicioAnoIso(): string {
  const [ano] = hojeIso().split("-");
  return `${ano}-01-01`;
}

// startDate por período — mesma regra do SPEC_TV.md (seções 5 e 6):
// hoje = hoje, mês = dia 1 do mês corrente, ano = 1º de janeiro. "ontem"
// não está no spec original (que só tinha Hoje/Mês/Ano) — por analogia,
// mesmo critério de tv.mock-service.ts.
function dataInicioPorPeriodo(periodo: PeriodoTv): string {
  switch (periodo) {
    case "hoje":
      return hojeIso();
    case "ontem":
      return ontemIso();
    case "mes":
      return inicioMesIso();
    case "ano":
      return inicioAnoIso();
  }
}

// endDate sempre fecha em hoje, exceto "ontem" (janela de 1 dia só) —
// evita ambiguidade no upstream sobre até quando somar (o SPEC_TV.md
// lista `endDate` na whitelist do proxy, mas não detalha o default).
function dataFimPorPeriodo(periodo: PeriodoTv): string {
  return periodo === "ontem" ? ontemIso() : hojeIso();
}

const PERIODOS: PeriodoTv[] = ["hoje", "ontem", "mes", "ano"];

// ─────────────────────────────────────────────────────────────────────
// vendas / aereo / terrestre — GET /api/consolidado/overview
// ─────────────────────────────────────────────────────────────────────

interface RawPeriodoOverview {
  tarifa: number;
  margem: number;
  clientes: number;
  tickets: number;
  ticket_medio: number;
  // `percentual` existe na resposta real, mas é fatia por ticket, não
  // por valor — omitido do tipo de propósito, pra não ser usado por
  // engano de novo (ver comentário em `paraCanalTv`).
  nacInter: {
    nacional: { tarifa: number };
    internacional: { tarifa: number };
  };
}
interface RawCanalOverview {
  dia: RawPeriodoOverview;
  mes: RawPeriodoOverview;
  ano: RawPeriodoOverview;
}
interface RawOverviewResponse {
  filial: {
    total: RawCanalOverview;
    aereo: RawCanalOverview;
    terrestre: RawCanalOverview;
  };
}

async function buscarOverview(data: string): Promise<RawOverviewResponse> {
  return comCache(`tv:overview:${data}`, () =>
    sstGet<RawOverviewResponse>("/api/consolidado/overview", {
      data,
      painel: "FILIAL",
      situacao: "ATIVOS",
    }),
  );
}

// `nacInter.*.percentual` do SST é a fatia por QUANTIDADE DE TICKETS,
// não por valor (confirmado ao vivo, 2026-08-24: nacional.tickets=942,
// internacional.tickets=248, 942/1190=79,16% = exatamente o
// "percentual" devolvido — enquanto a fatia por tarifa dava ~45%).
// nacPct/intlPct aqui precisam ser fatia por VALOR (é o que a barra do
// card mostra) — por isso calculado a partir de `.tarifa`, nunca de
// `.percentual`. Mesmo critério já usado (e comentado) em
// dashboard-vendas.sst-service.ts (paraNacIntDoOverview).
function paraCanalTv(periodo: RawPeriodoOverview): CanalTv {
  const nacional = periodo.nacInter.nacional.tarifa;
  const internacional = periodo.nacInter.internacional.tarifa;
  const totalNacInt = nacional + internacional;
  return {
    valorTotal: periodo.tarifa,
    bilhetes: periodo.tickets,
    agencias: periodo.clientes,
    ticketMedio: periodo.ticket_medio,
    nacPct: totalNacInt > 0 ? (nacional / totalNacInt) * 100 : 0,
    intlPct: totalNacInt > 0 ? (internacional / totalNacInt) * 100 : 0,
  };
}

// "hoje"/"ontem" pedem overview de dias diferentes; "mes"/"ano" já vêm
// no mesmo overview de "hoje" (um payload só traz dia/mês/ano juntos) —
// só 2 chamadas ao SST pra cobrir os 4 períodos.
async function construirVendasECanais(): Promise<Pick<TvData, "vendas" | "aereo" | "terrestre">> {
  const [overviewHoje, overviewOntem] = await Promise.all([
    buscarOverview(hojeIso()),
    buscarOverview(ontemIso()),
  ]);

  const overviewPorPeriodo: Record<PeriodoTv, RawOverviewResponse> = {
    hoje: overviewHoje,
    ontem: overviewOntem,
    mes: overviewHoje,
    ano: overviewHoje,
  };
  const bucketPorPeriodo: Record<PeriodoTv, "dia" | "mes" | "ano"> = {
    hoje: "dia",
    ontem: "dia",
    mes: "mes",
    ano: "ano",
  };

  const aereo = {} as Record<PeriodoTv, CanalTv>;
  const terrestre = {} as Record<PeriodoTv, CanalTv>;
  for (const periodo of PERIODOS) {
    const overview = overviewPorPeriodo[periodo];
    const bucket = bucketPorPeriodo[periodo];
    aereo[periodo] = paraCanalTv(overview.filial.aereo[bucket]);
    terrestre[periodo] = paraCanalTv(overview.filial.terrestre[bucket]);
  }

  return {
    vendas: {
      hoje: {
        valorTotal: overviewHoje.filial.total.dia.tarifa,
        margemPct: overviewHoje.filial.total.dia.margem,
      },
      mes: {
        valorTotal: overviewHoje.filial.total.mes.tarifa,
        margemPct: overviewHoje.filial.total.mes.margem,
      },
      ano: {
        valorTotal: overviewHoje.filial.total.ano.tarifa,
        margemPct: overviewHoje.filial.total.ano.margem,
      },
    },
    aereo,
    terrestre,
  };
}

// ─────────────────────────────────────────────────────────────────────
// shareAereo — GET /api/consolidado/vendas-por-companhia
// ─────────────────────────────────────────────────────────────────────

// Categorias confirmadas ao vivo em 2026-08-24 (ver
// docs/plano-fastview-backend.md, seção 4.1) — resposta real: data: [
// {categoria: "NACIONAL_AD"|"NACIONAL_G3"|"NACIONAL_JJ"|
// "NACIONAL_OUTRAS"|"INTERNACIONAL", tarifa, ...}]. "INTERNACIONAL" é
// descartada aqui — Share Aéreo do Fast View é só nacional (mesmo
// critério do SPEC_TV.md).
interface RawVendasPorCompanhiaLinha {
  categoria: string;
  tarifa: number;
}

const COMPANHIAS_NACIONAIS = [
  { categoria: "NACIONAL_AD", nome: "Azul", corHex: "#00A1E0" },
  { categoria: "NACIONAL_G3", nome: "Gol", corHex: "#FF6600" },
  { categoria: "NACIONAL_JJ", nome: "Latam", corHex: "#E91E8C" },
  { categoria: "NACIONAL_OUTRAS", nome: "Outras", corHex: "#fbcfe8" },
] as const;

async function buscarShareAereoDoPeriodo(periodo: PeriodoTv): Promise<CompanhiaShareTv[]> {
  const startDate = dataInicioPorPeriodo(periodo);
  const endDate = dataFimPorPeriodo(periodo);
  const resposta = await comCache(`tv:share:${startDate}:${endDate}`, () =>
    sstGet<{ data: RawVendasPorCompanhiaLinha[] }>("/api/consolidado/vendas-por-companhia", {
      startDate,
      endDate,
      status: "ATIVOS",
      painel: "FILIAL",
    }),
  );

  const tarifaPorCategoria = new Map(resposta.data.map((linha) => [linha.categoria, linha.tarifa]));
  const valoresAbsolutos = COMPANHIAS_NACIONAIS.map((companhia) => ({
    ...companhia,
    valorAbsoluto: tarifaPorCategoria.get(companhia.categoria) ?? 0,
  }));
  const totalNacional = valoresAbsolutos.reduce((soma, item) => soma + item.valorAbsoluto, 0);

  return valoresAbsolutos.map(({ categoria: _categoria, ...resto }) => ({
    ...resto,
    pct: totalNacional > 0 ? (resto.valorAbsoluto / totalNacional) * 100 : 0,
  }));
}

async function construirShareAereo(): Promise<Record<PeriodoTv, CompanhiaShareTv[]>> {
  const entradas = await Promise.all(
    PERIODOS.map(async (periodo) => [periodo, await buscarShareAereoDoPeriodo(periodo)] as const),
  );
  return Object.fromEntries(entradas) as Record<PeriodoTv, CompanhiaShareTv[]>;
}

// ─────────────────────────────────────────────────────────────────────
// top10Clientes / top10Nacional / top10Internacional —
// GET /api/consolidado/top-clientes
// ─────────────────────────────────────────────────────────────────────

// Confirmado ao vivo em 2026-08-24 (docs/plano-fastview-backend.md,
// seção 4.2): resposta já vem ordenada por `tarifa` desc, com `margem`
// por cliente — nenhum recálculo necessário.
interface RawTopClienteLinha {
  nome: string;
  tarifa: number;
  margem: number;
}
interface RawTopClientesResponse {
  geral: RawTopClienteLinha[];
  nacional: RawTopClienteLinha[];
  internacional: RawTopClienteLinha[];
}

function paraTop10(linhas: RawTopClienteLinha[]): Top10LinhaTv[] {
  return linhas.map((linha, indice) => ({
    posicao: indice + 1,
    nome: linha.nome,
    valor: linha.tarifa,
    margemPct: linha.margem,
  }));
}

async function buscarTopClientesDoPeriodo(periodo: PeriodoTv): Promise<RawTopClientesResponse> {
  const startDate = dataInicioPorPeriodo(periodo);
  const endDate = dataFimPorPeriodo(periodo);
  return comCache(`tv:top-clientes:${startDate}:${endDate}`, () =>
    sstGet<RawTopClientesResponse>("/api/consolidado/top-clientes", {
      startDate,
      endDate,
      limit: 10,
      status: "ATIVOS",
      painel: "FILIAL",
    }),
  );
}

async function construirTop10(): Promise<
  Pick<TvData, "top10Clientes" | "top10Nacional" | "top10Internacional">
> {
  const porPeriodo = await Promise.all(
    PERIODOS.map(async (periodo) => [periodo, await buscarTopClientesDoPeriodo(periodo)] as const),
  );

  const top10Clientes = {} as Record<PeriodoTv, Top10LinhaTv[]>;
  const top10Nacional = {} as Record<PeriodoTv, Top10LinhaTv[]>;
  const top10Internacional = {} as Record<PeriodoTv, Top10LinhaTv[]>;
  for (const [periodo, resposta] of porPeriodo) {
    top10Clientes[periodo] = paraTop10(resposta.geral);
    top10Nacional[periodo] = paraTop10(resposta.nacional);
    top10Internacional[periodo] = paraTop10(resposta.internacional);
  }

  return { top10Clientes, top10Nacional, top10Internacional };
}

async function obterDadosReais(): Promise<TvData> {
  const [vendasECanais, shareAereo, top10] = await Promise.all([
    comFallback("vendas/aereo/terrestre", construirVendasECanais(), vendasECanaisVazio()),
    comFallback("shareAereo", construirShareAereo(), shareAereoVazio()),
    comFallback("top10", construirTop10(), top10Vazio()),
  ]);

  return { ...vendasECanais, shareAereo, ...top10 };
}

export const tvSstService = {
  obterDados: obterDadosReais,
};

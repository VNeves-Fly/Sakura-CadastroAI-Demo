import {
  requireSstApiKey,
  sstBaseUrl,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import type {
  CanalResumo,
  Conversao,
  ConversaoCanal,
  DashboardVendasData,
  MiniKpis,
  NacionalInternacional,
  ResumoDia,
  TopAgencia,
  TopFornecedor,
  VendaDiaria,
  VendaMensal,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Integração real com o SST (sst.flysakura.com, "Financial Adapter
// Service" — spec em /docs/json) pras seções do dashboard que já têm
// endpoint direto (ver docs/crm-backend.md, seção de match). O resto
// (intraday, projeção, acurácia, recência e cruzamento de canais) continua
// vindo do mock — não tem endpoint pronto no SST pra essas, e algumas
// exigem decisão de negócio e/ou tabela+job próprios (ver crm-backend.md,
// seção 4, e docs/faltante.md). Igual ao mock, só esta função troca de
// implementação quando o resto for destravado.
//
// `painel=FILIAL`/`situacao=ATIVOS` confirmados contra o código-fonte do
// SST (ver docs/resposta.md): os 3 endpoints de ranking/nac-int abaixo já
// são Filial-only e ATIVOS-only, sempre — hardcoded no SQL deles
// (`mpd=0`/`cancelado=0`), sem parâmetro pra mudar. Batem com o
// `/api/consolidado/overview` (que aceita `painel`/`situacao` explícitos,
// usados abaixo). Qual painel exibir (Filial vs. Ambos) e se `ATIVOS` é a
// régua certa continuam decisão de negócio em aberto — ver docs/faltante.md.

const TAMANHO_RANKING = 300;
const TAMANHO_RANKING_FORNECEDORES = 200;

// `vendasMensais`/`vendasDiarias`/`conversao` não têm endpoint de série
// pronto — cada carregamento faz várias chamadas extras (uma por mês/dia).
// Cache em memória de processo (TTL curto) evita repetir isso a cada
// navegação. NÃO é distribuído: reseta a cada deploy/restart e não é
// compartilhado entre instâncias — se o app escalar horizontalmente,
// precisa de um cache compartilhado (Redis) no lugar deste Map.
const TTL_CACHE_MS = 10 * 60 * 1000;
const cacheConsolidado = new Map<string, { expiraEm: number; valor: unknown }>();

async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const cacheado = cacheConsolidado.get(chave);
  if (cacheado && cacheado.expiraEm > Date.now()) {
    return cacheado.valor as T;
  }
  const valor = await buscar();
  cacheConsolidado.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor });
  return valor;
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

function diasAtrasIso(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return formatarDataIsoBrasilia(data);
}

function partesHoje(): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = hojeIso().split("-").map(Number) as [number, number, number];
  return { ano, mes, dia };
}

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

function paraIso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Mesmo intervalo do mês anterior (dia 1 até o mesmo dia de hoje, com
// ajuste se o mês anterior for mais curto) — usado pra comparação MoM. É
// mês-a-data, não mês fechado — mesma convenção já usada em
// `resumoPorPeriodo`; ainda decisão de negócio em aberto (docs/faltante.md).
function janelaMesAnterior(): { inicio: string; fim: string } {
  const { ano, mes, dia } = partesHoje();
  const anteriorMes = mes === 1 ? 12 : mes - 1;
  const anteriorAno = mes === 1 ? ano - 1 : ano;
  const diaFim = Math.min(dia, ultimoDiaDoMes(anteriorAno, anteriorMes));
  return {
    inicio: paraIso(anteriorAno, anteriorMes, 1),
    fim: paraIso(anteriorAno, anteriorMes, diaFim),
  };
}

const NOMES_MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function formatarPeriodo(inicio: string, fim: string): string {
  const [, mesIni, diaIni] = inicio.split("-").map(Number) as [number, number, number];
  const [, mesFim, diaFim] = fim.split("-").map(Number) as [number, number, number];
  if (mesIni === mesFim) return `${diaIni}–${diaFim} ${NOMES_MESES[mesIni - 1]}`;
  return `${diaIni} ${NOMES_MESES[mesIni - 1]}–${diaFim} ${NOMES_MESES[mesFim - 1]}`;
}

// Um item por mês, de janeiro até o mês corrente (mês corrente vai só até
// hoje, os fechados vão até o último dia) — mesma base de `vendasMensais`.
function mesesDoAnoAteHoje(): Array<{ label: string; inicio: string; fim: string }> {
  const { ano, mes } = partesHoje();
  const sufixoAno = String(ano).slice(-2);
  const meses: Array<{ label: string; inicio: string; fim: string }> = [];
  for (let m = 1; m <= mes; m++) {
    const inicio = paraIso(ano, m, 1);
    const fim = m === mes ? hojeIso() : paraIso(ano, m, ultimoDiaDoMes(ano, m));
    const nome = NOMES_MESES[m - 1]!;
    meses.push({
      label: `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${sufixoAno}`,
      inicio,
      fim,
    });
  }
  return meses;
}

function ultimosNDias(quantidade: number): Array<{ label: string; data: string }> {
  return Array.from({ length: quantidade }, (_, indice) => {
    const iso = diasAtrasIso(quantidade - 1 - indice);
    const [, mes, dia] = iso.split("-");
    return { label: `${dia}/${mes}`, data: iso };
  });
}

async function sstGet<T>(
  caminho: string,
  parametros: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(caminho, sstBaseUrl());
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }

  const response = await fetch(url, {
    headers: { accept: "application/json", "X-Internal-Secret": requireSstApiKey() },
  });

  if (!response.ok) {
    throw new Error(`SST respondeu ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

// Shape bruto de GET /api/consolidado/overview (confirmado contra o SST
// real, 2026-08-14) — `margem`/`tarifa`/`tickets`/`clientes`/`ticket_medio`
// por período (dia/mes/ano), por canal (total/aereo/terrestre).
interface RawPeriodoOverview {
  tarifa: number;
  margem: number;
  clientes: number;
  tickets: number;
  ticket_medio: number;
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

interface RawPaginado<T> {
  data: T[];
  total: number;
}

// GET /api/agencias/top — `canal: "aereo"` na normalização abaixo não é
// aproximação, é garantido: a query consulta exclusivamente
// `pub_sica.bilhete` (tabela só de bilhetes aéreos do SICA), confirmado
// contra o código-fonte do SST (docs/resposta.md, item 1) — vendas
// terrestres nunca entram em `tarifa_total`/`total_bilhetes` aqui.
interface RawTopAgencia {
  nome_fantasia: string;
  total_bilhetes: number;
  tarifa_total: number;
}

// GET /api/reports/ranking-cias — `nome_companhia` às vezes vem só o
// código numérico da companhia em vez do nome. Confirmado contra o
// código-fonte do SST (docs/resposta.md, item 2): não é falta de lógica —
// o SST já faz um LEFT JOIN com a tabela de companhias e só cai pro
// código quando essa tabela não tem a companhia cadastrada (gap de dado
// na origem/SICA, não algo que uma tradução nossa resolva sozinha).
// Recomendação recebida: portar o mapa local IATA→nome que o CRM antigo
// já usava (`SIGLA_TO_NOME`, docs/CRM.md:261) como fallback de exibição —
// ainda não portado aqui por falta do conteúdo real desse mapa (repassado
// como veio até lá).
interface RawRankingCia {
  nome_companhia: string;
  total_bilhetes: number;
  tarifa_total: number;
}

// GET /api/consolidado/nacional-vs-internacional — devolve um array com
// (no máximo) uma linha por `tipo_rota`, não um objeto {nacional,
// internacional} pronto — normalizado abaixo. Filial-only/ATIVOS-only
// hardcoded no SQL do SST, mesma confirmação dos dois endpoints acima
// (docs/resposta.md, item 1).
interface RawNacIntRow {
  tipo_rota: "NAC" | "INTER";
  total_bilhetes: number;
  tarifa_total: number;
}

// GET /api/consolidado/air e /api/consolidado/non-air (sem `data`,
// aceitam startDate/endDate arbitrários) — confirmado contra o SST real:
// mesmo shape agregado do `/overview`, mas pra um intervalo qualquer, sem
// o wrapper `filial`. Usam `status` (não `situacao`) e aceitam `painel`
// (diferente dos 3 endpoints de ranking/nac-int, que não aceitam).
interface RawConsolidadoPeriodo {
  tarifa: number;
  clientes: number;
  tickets: number;
}

// GET /api/reports/saude-bases — uma linha por filial; `agencias_ativas`
// é status de cadastro habilitado (`e.ativo = 1`), independente de
// bloqueio de crédito (docs/resposta2.md, item 2) — mesmo campo usado em
// `/api/reports/base-empresa-cadastro`. Somado entre todas as filiais dá
// o denominador de `saudePct`.
interface RawSaudeBase {
  agencias_ativas: number;
}

async function buscarAir(inicio: string, fim: string): Promise<RawConsolidadoPeriodo> {
  return comCache(`air:${inicio}:${fim}`, () =>
    sstGet<RawConsolidadoPeriodo>("/api/consolidado/air", {
      startDate: inicio,
      endDate: fim,
      painel: "FILIAL",
      status: "ATIVOS",
    }),
  );
}

async function buscarNonAir(inicio: string, fim: string): Promise<RawConsolidadoPeriodo> {
  return comCache(`nonair:${inicio}:${fim}`, () =>
    sstGet<RawConsolidadoPeriodo>("/api/consolidado/non-air", {
      startDate: inicio,
      endDate: fim,
      painel: "FILIAL",
      status: "ATIVOS",
    }),
  );
}

async function buscarNacInt(inicio: string, fim: string): Promise<RawPaginado<RawNacIntRow>> {
  return comCache(`nacint:${inicio}:${fim}`, () =>
    sstGet<RawPaginado<RawNacIntRow>>("/api/consolidado/nacional-vs-internacional", {
      startDate: inicio,
      endDate: fim,
    }),
  );
}

// `limit=500` cobre o universo hoje (38 filiais num teste real) — sem
// paginação de verdade, mesma decisão de escopo do resto do arquivo.
async function totalAgenciasAtivas(): Promise<number> {
  const resposta = await sstGet<RawPaginado<RawSaudeBase>>("/api/reports/saude-bases", {
    limit: 500,
  });
  return resposta.data.reduce((acumulado, base) => acumulado + base.agencias_ativas, 0);
}

function calcularVariacaoPct(atual: number, anterior: number): number {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
}

function paraCanalResumo(periodo: RawPeriodoOverview): CanalResumo {
  return {
    valor: periodo.tarifa,
    quantidade: periodo.tickets,
    // Recalculado em dashboard-vendas.adapter.ts a partir de valor —
    // nunca vem pronto da origem (mesmo contrato do mock).
    participacaoPct: 0,
    margemPct: periodo.margem,
  };
}

function paraResumoDia(overview: RawOverviewResponse, periodo: "dia" | "mes" | "ano"): ResumoDia {
  return {
    atualizadoEm: new Date(),
    aereo: paraCanalResumo(overview.filial.aereo[periodo]),
    terrestre: paraCanalResumo(overview.filial.terrestre[periodo]),
  };
}

function paraMiniKpis(overviewHoje: RawOverviewResponse): MiniKpis {
  const aereoHoje = overviewHoje.filial.aereo.dia;
  return {
    clientesDistintos: aereoHoje.clientes,
    bilhetesAereo: aereoHoje.tickets,
    ticketMedioAereo: aereoHoje.ticket_medio,
  };
}

function paraTopAgencias(linhas: RawTopAgencia[]): TopAgencia[] {
  return linhas.map((linha, indice): TopAgencia => ({
    posicao: indice + 1,
    nome: linha.nome_fantasia,
    canal: "aereo",
    valor: linha.tarifa_total,
    qtd: linha.total_bilhetes,
  }));
}

function paraTopFornecedores(linhas: RawRankingCia[]): TopFornecedor[] {
  const valorTotal = linhas.reduce((acumulado, linha) => acumulado + linha.tarifa_total, 0);
  return linhas.map((linha) => ({
    nome: linha.nome_companhia,
    qtdBilhetes: linha.total_bilhetes,
    valor: linha.tarifa_total,
    participacaoPct: valorTotal > 0 ? (linha.tarifa_total / valorTotal) * 100 : 0,
  }));
}

function paraNacionalInternacional(linhas: RawNacIntRow[]): NacionalInternacional {
  const nacional = linhas.find((linha) => linha.tipo_rota === "NAC");
  const internacional = linhas.find((linha) => linha.tipo_rota === "INTER");
  return {
    nacional: { valor: nacional?.tarifa_total ?? 0, bilhetes: nacional?.total_bilhetes ?? 0 },
    internacional: {
      valor: internacional?.tarifa_total ?? 0,
      bilhetes: internacional?.total_bilhetes ?? 0,
    },
  };
}

async function construirVendasMensais(): Promise<VendaMensal[]> {
  const meses = mesesDoAnoAteHoje();
  return Promise.all(
    meses.map(async (mes): Promise<VendaMensal> => {
      const [nacInt, terrestre] = await Promise.all([
        buscarNacInt(mes.inicio, mes.fim),
        buscarNonAir(mes.inicio, mes.fim),
      ]);
      const { nacional, internacional } = paraNacionalInternacional(nacInt.data);
      return {
        mes: mes.label,
        aereoNacional: nacional.valor,
        aereoInternacional: internacional.valor,
        terrestre: terrestre.tarifa,
      };
    }),
  );
}

async function construirVendasDiarias(): Promise<VendaDiaria[]> {
  const dias = ultimosNDias(30);
  return Promise.all(
    dias.map(async (dia): Promise<VendaDiaria> => {
      const [aereo, terrestre] = await Promise.all([
        buscarAir(dia.data, dia.data),
        buscarNonAir(dia.data, dia.data),
      ]);
      return { data: dia.label, aereo: aereo.tarifa, terrestre: terrestre.tarifa };
    }),
  );
}

// `saudePct`/`agenciasMesVarPct` de "ambos" continuam do mock: somar
// aéreo+terrestre é seguro pra valor/bilhetes (não se sobrepõem), mas nº
// de agências e saúde exigiriam contar cada agência uma vez só entre os
// dois canais (união, não soma) — precisa do endpoint terrestre "por
// agência" que o SST ainda não construiu (docs/faltante.md, seção
// `recencia`/backlog de engenharia).
async function construirConversao(conversaoMock: Conversao): Promise<Conversao> {
  const hoje = hojeIso();
  const inicioMes = inicioMesIso();
  const anterior = janelaMesAnterior();
  const trintaDiasAtras = diasAtrasIso(30);

  const [
    airAtual,
    airAnterior,
    nonAirAtual,
    nonAirAnterior,
    airUltimos30d,
    nonAirUltimos30d,
    ativas,
  ] = await Promise.all([
    buscarAir(inicioMes, hoje),
    buscarAir(anterior.inicio, anterior.fim),
    buscarNonAir(inicioMes, hoje),
    buscarNonAir(anterior.inicio, anterior.fim),
    buscarAir(trintaDiasAtras, hoje),
    buscarNonAir(trintaDiasAtras, hoje),
    totalAgenciasAtivas(),
  ]);

  const periodoComparativo = `${formatarPeriodo(anterior.inicio, anterior.fim)} vs ${formatarPeriodo(inicioMes, hoje)}`;
  const aereoMes = { valor: airAtual.tarifa, bilhetes: airAtual.tickets };
  const terrestreMes = { valor: nonAirAtual.tarifa, vendas: nonAirAtual.tickets };

  const aereo: ConversaoCanal = {
    saudePct: ativas > 0 ? (airUltimos30d.clientes / ativas) * 100 : 0,
    volumeMesVarPct: calcularVariacaoPct(airAtual.tarifa, airAnterior.tarifa),
    bilhetesVendasMesVarPct: calcularVariacaoPct(airAtual.tickets, airAnterior.tickets),
    agenciasMesVarPct: calcularVariacaoPct(airAtual.clientes, airAnterior.clientes),
    periodoComparativo,
    aereoMes,
    terrestreMes,
  };

  const terrestre: ConversaoCanal = {
    saudePct: ativas > 0 ? (nonAirUltimos30d.clientes / ativas) * 100 : 0,
    volumeMesVarPct: calcularVariacaoPct(nonAirAtual.tarifa, nonAirAnterior.tarifa),
    bilhetesVendasMesVarPct: calcularVariacaoPct(nonAirAtual.tickets, nonAirAnterior.tickets),
    agenciasMesVarPct: calcularVariacaoPct(nonAirAtual.clientes, nonAirAnterior.clientes),
    periodoComparativo,
    aereoMes,
    terrestreMes,
  };

  const ambos: ConversaoCanal = {
    saudePct: conversaoMock.ambos.saudePct,
    volumeMesVarPct: calcularVariacaoPct(
      airAtual.tarifa + nonAirAtual.tarifa,
      airAnterior.tarifa + nonAirAnterior.tarifa,
    ),
    bilhetesVendasMesVarPct: calcularVariacaoPct(
      airAtual.tickets + nonAirAtual.tickets,
      airAnterior.tickets + nonAirAnterior.tickets,
    ),
    agenciasMesVarPct: conversaoMock.ambos.agenciasMesVarPct,
    periodoComparativo,
    aereoMes,
    terrestreMes,
  };

  return { ambos, aereo, terrestre };
}

// Só pra teste — limpa o cache em memória entre casos, já que ele é
// module-scoped e sobreviveria entre `it()`s do mesmo arquivo de teste.
export function __limparCacheParaTestes(): void {
  cacheConsolidado.clear();
}

export const dashboardVendasSstService = {
  async obterDashboard(): Promise<DashboardVendasData> {
    // Fallback pras seções ainda sem fonte real (ver comentário no topo
    // do arquivo) — substituídas abaixo só nos campos já destravados.
    const mock = await dashboardVendasMockService.obterDashboard();

    const hoje = hojeIso();
    const ontem = ontemIso();
    const inicioMes = inicioMesIso();
    const inicioAno = inicioAnoIso();

    const [
      overviewHoje,
      overviewOntem,
      topAgenciasMes,
      topAgenciasAno,
      rankingCiasMes,
      rankingCiasAno,
      nacIntMes,
      nacIntAno,
      vendasMensais,
      vendasDiarias,
      conversao,
    ] = await Promise.all([
      sstGet<RawOverviewResponse>("/api/consolidado/overview", {
        data: hoje,
        painel: "FILIAL",
        situacao: "ATIVOS",
      }),
      sstGet<RawOverviewResponse>("/api/consolidado/overview", {
        data: ontem,
        painel: "FILIAL",
        situacao: "ATIVOS",
      }),
      sstGet<RawPaginado<RawTopAgencia>>("/api/agencias/top", {
        startDate: inicioMes,
        endDate: hoje,
        limit: TAMANHO_RANKING,
      }),
      sstGet<RawPaginado<RawTopAgencia>>("/api/agencias/top", {
        startDate: inicioAno,
        endDate: hoje,
        limit: TAMANHO_RANKING,
      }),
      sstGet<RawPaginado<RawRankingCia>>("/api/reports/ranking-cias", {
        startDate: inicioMes,
        endDate: hoje,
        limit: TAMANHO_RANKING_FORNECEDORES,
      }),
      sstGet<RawPaginado<RawRankingCia>>("/api/reports/ranking-cias", {
        startDate: inicioAno,
        endDate: hoje,
        limit: TAMANHO_RANKING_FORNECEDORES,
      }),
      sstGet<RawPaginado<RawNacIntRow>>("/api/consolidado/nacional-vs-internacional", {
        startDate: inicioMes,
        endDate: hoje,
      }),
      sstGet<RawPaginado<RawNacIntRow>>("/api/consolidado/nacional-vs-internacional", {
        startDate: inicioAno,
        endDate: hoje,
      }),
      construirVendasMensais(),
      construirVendasDiarias(),
      construirConversao(mock.conversao),
    ]);

    return {
      ...mock,
      resumoPorPeriodo: {
        hoje: paraResumoDia(overviewHoje, "dia"),
        ontem: paraResumoDia(overviewOntem, "dia"),
        mes: paraResumoDia(overviewHoje, "mes"),
        ano: paraResumoDia(overviewHoje, "ano"),
      },
      miniKpis: paraMiniKpis(overviewHoje),
      conversao,
      vendasMensais,
      vendasDiarias,
      rankingPorMes: {
        mes: paraTopAgencias(topAgenciasMes.data),
        ano: paraTopAgencias(topAgenciasAno.data),
      },
      fornecedoresPorMes: {
        mes: paraTopFornecedores(rankingCiasMes.data),
        ano: paraTopFornecedores(rankingCiasAno.data),
      },
      nacionalInternacionalPorMes: {
        mes: paraNacionalInternacional(nacIntMes.data),
        ano: paraNacionalInternacional(nacIntAno.data),
      },
    };
  },
};

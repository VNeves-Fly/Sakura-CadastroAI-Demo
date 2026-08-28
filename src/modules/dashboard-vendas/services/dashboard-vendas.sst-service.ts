import {
  requireSstApiKey,
  sstBaseUrl,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";
import { valkeyGet, valkeySet } from "@/modules/dashboard-vendas/infrastructure/valkey-cache.util";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import {
  conversaoVazia,
  projecaoVazia,
  recenciaECruzamentoVazio,
  resumoEDiaVazio,
} from "@/modules/dashboard-vendas/utils/dashboard-vendas-vazio.util";
import {
  calcularCurvaHoraria,
  calcularFormaHoraria,
  calcularProjecaoDoDia,
  type AmostraDia,
  type AmostraHoraria,
} from "@/modules/dashboard-vendas/services/dashboard-vendas.projecao.util";
import type {
  AgenciaCruzamentoDetalhe,
  AgenciaRecenciaDetalhe,
  Canal,
  CanalResumo,
  ChaveCruzamento,
  ChaveRecencia,
  Conversao,
  ConversaoCanal,
  CruzamentoCanais,
  DashboardVendasData,
  GrupoRecencia,
  MiniKpis,
  NacionalInternacional,
  PeriodoResumo,
  ProjecaoDia,
  RecenciaAgencias,
  ResumoDia,
  ResumoPersonalizado,
  TopAgencia,
  TopFornecedor,
  VendaDiaria,
  VendaMensal,
} from "@/modules/dashboard-vendas/types/dashboard-vendas.types";

// Integração real com o SST (sst.flysakura.com, "Financial Adapter
// Service" — spec em /docs/json) pras seções do dashboard que já têm
// endpoint direto (ver docs/crm-backend.md, seção de match). O resto
// (intraday, projeção, acurácia) continua vindo do mock — não tem
// endpoint pronto no SST pra essas, e exigem decisão de negócio e/ou
// tabela+job próprios (ver crm-backend.md, seção 4, e docs/faltante.md).
// Igual ao mock, só esta função troca de implementação quando o resto for
// destravado.
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
// Cache de dois níveis (TTL curto) evita repetir isso a cada navegação:
// L1 é o `Map` de sempre (por processo, sem I/O — cobre repetições dentro
// da mesma instância). L2 é o Valkey (`valkey-cache.util.ts`), compartilhado
// entre instâncias do Cloud Run — só entra em jogo com `VALKEY_URL`
// configurada; sem ela, `valkeyGet`/`valkeySet` são no-ops e o
// comportamento fica idêntico ao `Map` isolado de antes.
const TTL_CACHE_MS = 10 * 60 * 1000;
const cacheConsolidado = new Map<string, { expiraEm: number; valor: unknown }>();

async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  const cacheado = cacheConsolidado.get(chave);
  if (cacheado && cacheado.expiraEm > Date.now()) {
    return cacheado.valor as T;
  }

  const doValkey = await valkeyGet<T>(chave);
  if (doValkey !== undefined) {
    cacheConsolidado.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor: doValkey });
    return doValkey;
  }

  const valor = await buscar();
  cacheConsolidado.set(chave, { expiraEm: Date.now() + TTL_CACHE_MS, valor });
  await valkeySet(chave, valor, TTL_CACHE_MS / 1000);
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

// Mesma data de calendário, exatamente 1 ano atrás — ponto de comparação
// "LY" (last-year) de margem/rentabilidade real, mesmo critério de
// executivo-dashboard.sst-service.ts (não trata 29/fev especialmente,
// irrelevante na prática pra essa comparação).
function mesmoDiaAnoAnteriorIso(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - 1);
  return formatarDataIsoBrasilia(data);
}

// Mesmo intervalo (mesma quantidade de dias corridos), 1 ano atrás —
// comparação "LY" do filtro Personalizado, equivalente a
// mesmoDiaAnoAnteriorIso mas para um range em vez de um dia só. Ajusta o
// dia se o mês de destino for mais curto (mesmo critério de
// janelaMesAnterior, ver ultimoDiaDoMes abaixo).
function mesmoIntervaloAnoAnteriorIso(
  inicio: string,
  fim: string,
): { inicio: string; fim: string } {
  const umAnoAtras = (iso: string): string => {
    const [ano, mes, dia] = iso.split("-").map(Number) as [number, number, number];
    const anoAnterior = ano - 1;
    return paraIso(anoAnterior, mes, Math.min(dia, ultimoDiaDoMes(anoAnterior, mes)));
  };
  return { inicio: umAnoAtras(inicio), fim: umAnoAtras(fim) };
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

// Mesmo dia da semana de hoje, nas últimas `quantidade` ocorrências
// (7, 14, 21... dias atrás), sem incluir hoje — usado pelo algoritmo de
// projeção (média das últimas semanas, mesmo dia da semana).
function mesmasSemanasAnteriores(quantidade: number): string[] {
  return Array.from({ length: quantidade }, (_, indice) => diasAtrasIso(7 * (indice + 1)));
}

function calcularPercentualDiaTranscorrido(agora: Date): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const hora = Number(partes.find((parte) => parte.type === "hour")!.value);
  const minuto = Number(partes.find((parte) => parte.type === "minute")!.value);
  return ((hora * 60 + minuto) / (24 * 60)) * 100;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Só as séries (`vendasMensais`/`vendasDiarias`/`conversao`/`recencia`/
// `cruzamentoCanais`) disparam dezenas de chamadas concorrentes ao
// paginar `/api/resumos/terrestre` — já observado mais de um 500
// transiente do SST ("[sigot] rawQuery failed") sob essa concorrência,
// inclusive esgotando o retry abaixo numa carga real (não só em teste).
// Retry curto só em 5xx (erro do servidor deles, vale tentar de novo);
// 4xx não se beneficia de retry (é erro nosso de parâmetro).
const TENTATIVAS_5XX = 3;

async function sstGet<T>(
  caminho: string,
  parametros: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(caminho, sstBaseUrl());
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor));
  }

  for (let tentativa = 0; ; tentativa++) {
    const response = await fetch(url, {
      headers: { accept: "application/json", "X-Internal-Secret": requireSstApiKey() },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const corpo = await response.text();
    if (response.status < 500 || tentativa >= TENTATIVAS_5XX) {
      throw new Error(`SST respondeu ${response.status}: ${corpo}`);
    }
    await esperar(300 * (tentativa + 1));
  }
}

// Degrada uma seção pro mock em vez de derrubar o dashboard inteiro — já
// aconteceu de um 500 do SST (sob a concorrência da paginação de
// terrestre) esgotar todas as tentativas de retry e quebrar a página
// inteira. Cada seção pesada (série/recência/cruzamento) fica isolada:
// se ela falhar, só ela volta a ser mock, o resto continua real.
async function comFallback<T>(rotulo: string, tarefa: Promise<T>, valorMock: T): Promise<T> {
  try {
    return await tarefa;
  } catch (erro) {
    console.error(
      `[dashboard-vendas] "${rotulo}" falhou contra o SST — usando mock só nesta seção.`,
      erro,
    );
    return valorMock;
  }
}

// Shape bruto de GET /api/consolidado/overview (confirmado contra o SST
// real, 2026-08-19) — `margem`/`tarifa`/`tickets`/`clientes`/`ticket_medio`
// por período (dia/mes/ano), por canal (total/aereo/terrestre). `nacInter`
// já vem embutido aqui — sem precisar de chamada separada a
// /api/relatorios/nacional-vs-internacional pra hoje/ontem (só mês/ano
// continuam usando `buscarNacInt`, que também alimenta vendasMensais via
// cache compartilhado, ver obterResumoEDia). `rentabilidade` também vem
// nesse mesmo payload (reconfirmado em executivo-dashboard.sst-service.ts,
// 2026-08-24) — só não era lido aqui até a comparação LY existir.
interface RawPeriodoOverview {
  tarifa: number;
  margem: number;
  rentabilidade: number;
  clientes: number;
  tickets: number;
  ticket_medio: number;
  nacInter: {
    nacional: { tickets: number; tarifa: number; percentual: number };
    internacional: { tickets: number; tarifa: number; percentual: number };
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

// GET /api/consolidado/overview-intervalo — mesmo shape de
// RawPeriodoOverview por canal (total/aereo/terrestre), mas para um único
// intervalo (startDate/endDate) em vez dos 3 buckets fixos dia/mes/ano do
// /overview — pedido ao SST especificamente pro filtro "Personalizado"
// (ver docs/filtro-personalizado.md; spec confirmada contra
// https://sst.flysakura.com/docs-json em 2026-08-28).
interface RawOverviewIntervaloResponse {
  filial: {
    total: RawPeriodoOverview;
    aereo: RawPeriodoOverview;
    terrestre: RawPeriodoOverview;
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

// GET /api/reports/ranking-cias — o SST já trocou o nome desses dois
// campos pelo menos uma vez em produção sem aviso (`codigo_fornecedor`/
// `nome_companhia` → `numero_cia_iata`/`nome_cia`, observado em
// 2026-08-19) — por isso os dois formatos ficam como opcionais aqui e
// `paraTopFornecedores` abaixo aceita qualquer um dos dois. Também já
// veio `nome_companhia` só com o código numérico da companhia em vez do
// nome (confirmado contra o código-fonte do SST, docs/resposta.md, item
// 2: LEFT JOIN que cai pro código quando a tabela de companhias não tem
// a companhia cadastrada — gap de dado na origem/SICA). Recomendação
// recebida: portar o mapa local IATA→nome que o CRM antigo já usava
// (`SIGLA_TO_NOME`, docs/CRM.md:261) como fallback de exibição — ainda
// não portado aqui por falta do conteúdo real desse mapa.
interface RawRankingCia {
  codigo_fornecedor?: number | string;
  nome_companhia?: string;
  numero_cia_iata?: number | string;
  nome_cia?: string;
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
// `comCache` (não `sstGet` direto) de propósito: `construirConversao` e
// `construirCruzamento` chamam isto cada um por conta própria, no mesmo
// carregamento — sem cache, batia 2x no SST pro mesmo dado (ver
// docs/optimize.md, ponto 1).
async function totalAgenciasAtivas(): Promise<number> {
  return comCache("saude-bases", async () => {
    const resposta = await sstGet<RawPaginado<RawSaudeBase>>("/api/reports/saude-bases", {
      limit: 500,
    });
    return resposta.data.reduce((acumulado, base) => acumulado + base.agencias_ativas, 0);
  });
}

function calcularVariacaoPct(atual: number, anterior: number): number {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
}

// `recenciaECruzamento` (estágio anterior no waterfall de
// dashboard-vendas-view.tsx) já busca `Map<codigo, {ultima, ...}>` pra
// janelas largas (365d aéreo / 90d terrestre, ver `buscarAereoJanela`/
// `buscarTerrestreJanela` abaixo). Qualquer janela "N dias atrás → hoje"
// mais estreita que essas (ex.: 30d, mês corrente, usadas em
// `construirConversao`) já está coberta por elas — dá pra responder "essa
// agência vendeu nesse intervalo?" só com `ultima >= corte`, sem nova
// chamada ao SST. Só funciona pra janelas que terminam hoje: pra uma
// janela no passado (ex. mês anterior), `ultima` sendo posterior ao fim
// da janela não prova nem desmente venda dentro dela — aí cai pro fetch
// de verdade (ver chamadas em codigosAgenciasAereo/codigosAgenciasTerrestre
// abaixo). Cache miss aqui é barato (é só um Map.get + no máximo 1 GET no
// Valkey) comparado ao custo de paginar terrestre de novo.
async function tentarDerivarDeJanela(
  chaveJanela: string,
  corte: string,
): Promise<Set<number> | undefined> {
  const cacheado = cacheConsolidado.get(chaveJanela);
  const mapa =
    cacheado && cacheado.expiraEm > Date.now()
      ? (cacheado.valor as Map<number, DadosPorAgencia>)
      : await valkeyGet<Map<number, DadosPorAgencia>>(chaveJanela);
  if (!mapa) return undefined;

  const codigos = new Set<number>();
  for (const [codigo, dados] of mapa) {
    if (dados.ultima >= corte) codigos.add(codigo);
  }
  return codigos;
}

// GET /api/consolidado/air/resumo-agrupado — confirmado contra o SST
// real: devolve um array já agrupado por empresa (uma linha por
// agência, sem paginação/wrapper) — dá o conjunto de códigos de agência
// que venderam aéreo no intervalo direto, sem precisar paginar.
interface RawResumoAgrupadoLinha {
  codigo: number;
}

async function codigosAgenciasAereo(inicio: string, fim: string): Promise<Set<number>> {
  if (fim === hojeIso()) {
    const viaJanela = await tentarDerivarDeJanela(
      `aereo-janela:${JANELA_AEREO_RECENCIA_DIAS}:${fim}`,
      inicio,
    );
    if (viaJanela) return viaJanela;
  }

  return comCache(`codigos-aereo:${inicio}:${fim}`, async () => {
    const linhas = await sstGet<RawResumoAgrupadoLinha[]>("/api/consolidado/air/resumo-agrupado", {
      agruparPor: "codigoEmpresa",
      startDate: inicio,
      endDate: fim,
    });
    return new Set(linhas.map((linha) => linha.codigo));
  });
}

// GET /api/resumos/terrestre — ao contrário do aéreo, não existe uma
// versão "resumo-agrupado" pra non-air ainda (backlog de engenharia do
// SST, ver docs/faltante.md). Mas dá pra chegar no mesmo resultado
// paginando o bruto e reduzindo pra um Set de `codigo_cliente` no
// próprio código — só custa mais chamadas (paginado, ~500/página).
interface RawResumoTerrestreLinha {
  codigo_cliente: number;
}

const LIMITE_PAGINA_TERRESTRE = 500;

async function codigosAgenciasTerrestre(inicio: string, fim: string): Promise<Set<number>> {
  if (fim === hojeIso()) {
    const viaJanela = await tentarDerivarDeJanela(
      `terrestre-janela:${JANELA_TERRESTRE_RECENCIA_DIAS}:${fim}`,
      inicio,
    );
    if (viaJanela) return viaJanela;
  }

  return comCache(`codigos-terrestre:${inicio}:${fim}`, async () => {
    const primeira = await sstGet<RawPaginado<RawResumoTerrestreLinha>>("/api/resumos/terrestre", {
      startDate: inicio,
      endDate: fim,
      page: 1,
      limit: LIMITE_PAGINA_TERRESTRE,
    });
    const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA_TERRESTRE);
    const paginasRestantes = await Promise.all(
      Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, indice) =>
        sstGet<RawPaginado<RawResumoTerrestreLinha>>("/api/resumos/terrestre", {
          startDate: inicio,
          endDate: fim,
          page: indice + 2,
          limit: LIMITE_PAGINA_TERRESTRE,
        }),
      ),
    );

    const codigos = new Set<number>();
    for (const pagina of [primeira, ...paginasRestantes]) {
      for (const linha of pagina.data) codigos.add(linha.codigo_cliente);
    }
    return codigos;
  });
}

// União aéreo ∪ terrestre — nº de agências distintas que venderam em
// pelo menos um dos dois canais no intervalo. Soma ingênua de
// `clientes` de cada canal contaria duas vezes quem vende os dois;
// união de conjuntos resolve isso de verdade.
async function contarAgenciasAtivasAmbos(inicio: string, fim: string): Promise<number> {
  const [aereo, terrestre] = await Promise.all([
    codigosAgenciasAereo(inicio, fim),
    codigosAgenciasTerrestre(inicio, fim),
  ]);
  return new Set([...aereo, ...terrestre]).size;
}

// `ly` é o mesmo bucket do overview de 1 ano atrás (ver
// mesmoDiaAnoAnteriorIso) — mesmo padrão de
// executivo-dashboard.sst-service.ts/paraCanalMargemPeriodo. `rentabilidade`
// vem pronta do SST (não deriva de tarifa×margem), evita drift de
// arredondamento vs. o valor que o próprio SST calculou.
function paraCanalResumo(periodo: RawPeriodoOverview, ly: RawPeriodoOverview): CanalResumo {
  return {
    valor: periodo.tarifa,
    quantidade: periodo.tickets,
    // Recalculado em dashboard-vendas.adapter.ts a partir de valor —
    // nunca vem pronto da origem (mesmo contrato do mock).
    participacaoPct: 0,
    margemPct: periodo.margem,
    margemLYPct: ly.margem,
    margemVariacaoPct: calcularVariacaoPct(periodo.margem, ly.margem),
    rentabValor: periodo.rentabilidade,
    rentabLYValor: ly.rentabilidade,
    rentabLYVariacaoPct: calcularVariacaoPct(periodo.rentabilidade, ly.rentabilidade),
    // nacInter já vem embutido no mesmo bucket — cada canal (aéreo,
    // terrestre) tem o seu próprio, não é o mesmo valor duplicado (ver
    // comentário em CanalResumo).
    nacIntDetalhe: paraNacIntDoOverview(periodo),
  };
}

function paraResumoDia(
  overview: RawOverviewResponse,
  overviewLY: RawOverviewResponse,
  periodo: "dia" | "mes" | "ano",
): ResumoDia {
  const totalAtual = overview.filial.total[periodo];
  const totalLY = overviewLY.filial.total[periodo];
  return {
    atualizadoEm: new Date(),
    aereo: paraCanalResumo(overview.filial.aereo[periodo], overviewLY.filial.aereo[periodo]),
    terrestre: paraCanalResumo(
      overview.filial.terrestre[periodo],
      overviewLY.filial.terrestre[periodo],
    ),
    // Margem combinada (Aéreo + Terrestre) — vem do bucket "total" do
    // overview, separado da margem de cada canal (pedido do usuário,
    // 2026-08-19).
    margemTotalPct: totalAtual.margem,
    margemTotalLYPct: totalLY.margem,
    margemTotalVariacaoPct: calcularVariacaoPct(totalAtual.margem, totalLY.margem),
    rentabTotalValor: totalAtual.rentabilidade,
    rentabTotalLYValor: totalLY.rentabilidade,
    rentabTotalLYVariacaoPct: calcularVariacaoPct(totalAtual.rentabilidade, totalLY.rentabilidade),
  };
}

// Mesmo cálculo de paraResumoDia, mas a partir de
// RawOverviewIntervaloResponse — não tem os buckets dia/mes/ano pra
// indexar, o próprio endpoint já devolve o intervalo pedido direto em
// filial.<canal> (ver obterResumoPersonalizado).
function paraResumoIntervalo(
  overview: RawOverviewIntervaloResponse,
  overviewLY: RawOverviewIntervaloResponse,
): ResumoDia {
  const totalAtual = overview.filial.total;
  const totalLY = overviewLY.filial.total;
  return {
    atualizadoEm: new Date(),
    aereo: paraCanalResumo(overview.filial.aereo, overviewLY.filial.aereo),
    terrestre: paraCanalResumo(overview.filial.terrestre, overviewLY.filial.terrestre),
    margemTotalPct: totalAtual.margem,
    margemTotalLYPct: totalLY.margem,
    margemTotalVariacaoPct: calcularVariacaoPct(totalAtual.margem, totalLY.margem),
    rentabTotalValor: totalAtual.rentabilidade,
    rentabTotalLYValor: totalLY.rentabilidade,
    rentabTotalLYVariacaoPct: calcularVariacaoPct(totalAtual.rentabilidade, totalLY.rentabilidade),
  };
}

function paraMiniKpis(aereo: RawPeriodoOverview): MiniKpis {
  return {
    clientesDistintos: aereo.clientes,
    bilhetesAereo: aereo.tickets,
    ticketMedioAereo: aereo.ticket_medio,
  };
}

// Um MiniKpis por período (mesma chave de resumoPorPeriodo) — todo o
// dado já vem nas respostas de overview já buscadas pra resumoPorPeriodo
// (overviewHoje tem dia/mes/ano, overviewOntem tem o "dia" de ontem), sem
// chamada nova ao SST (corrigido 2026-08-19 — antes ficava sempre fixo em
// "hoje", os cards Clientes/Bilhetes/Ticket Médio não acompanhavam o
// seletor de período do card de cima).
function paraMiniKpisPorPeriodo(
  overviewHoje: RawOverviewResponse,
  overviewOntem: RawOverviewResponse,
): Record<PeriodoResumo, MiniKpis> {
  return {
    hoje: paraMiniKpis(overviewHoje.filial.aereo.dia),
    ontem: paraMiniKpis(overviewOntem.filial.aereo.dia),
    mes: paraMiniKpis(overviewHoje.filial.aereo.mes),
    ano: paraMiniKpis(overviewHoje.filial.aereo.ano),
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
    nome:
      linha.nome_cia ||
      linha.nome_companhia ||
      String(linha.numero_cia_iata ?? linha.codigo_fornecedor ?? "Desconhecido"),
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

// Mesmo shape de saída de paraNacionalInternacional, mas a partir do
// `nacInter` que já vem embutido em /api/consolidado/overview — usado
// pra hoje/ontem, que só têm essa resposta disponível (mês/ano seguem
// vindo de buscarNacInt, compartilhado com vendasMensais via cache).
function paraNacIntDoOverview(periodoOverview: RawPeriodoOverview): NacionalInternacional {
  return {
    nacional: {
      valor: periodoOverview.nacInter.nacional.tarifa,
      bilhetes: periodoOverview.nacInter.nacional.tickets,
    },
    internacional: {
      valor: periodoOverview.nacInter.internacional.tarifa,
      bilhetes: periodoOverview.nacInter.internacional.tickets,
    },
  };
}

async function buscarAmostraDoDia(dataIso: string): Promise<AmostraDia> {
  const resposta = await buscarNacInt(dataIso, dataIso);
  const { nacional, internacional } = paraNacionalInternacional(resposta.data);
  return {
    data: dataIso,
    total: nacional.valor + internacional.valor,
    nacional: nacional.valor,
    internacional: internacional.valor,
  };
}

// GET /api/resumos/aereo — granularidade de bilhete, com `created_at`
// (quando a venda foi lançada, não a data de embarque). Ao contrário de
// `nacional-vs-internacional`, não classifica NAC/INTER por bilhete (só
// tem `rota` em códigos de aeroporto) — por isso a curva horária usa só
// o total (decisão confirmada, ver docs/faltante.md).
interface RawResumoAereoLinha {
  tarifa: number;
  created_at: string;
}

const LIMITE_PAGINA_AEREO = 500;

function horaBrasilia(data: Date | string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(data)),
  );
}

// Um dia cheio pode ter alguns milhares de bilhetes (~4.400 num teste
// real, ~9 páginas de 500) — cache de 10min (mesmo TTL do resto do
// arquivo) evita repaginar isso a cada carregamento do card.
async function buscarFormaHorariaDoDia(dataIso: string): Promise<AmostraHoraria> {
  return comCache(`horaAereo:${dataIso}`, async () => {
    const parametros = {
      createdAtStart: `${dataIso}T00:00:00`,
      createdAtEnd: `${dataIso}T23:59:59`,
      limit: LIMITE_PAGINA_AEREO,
    };
    const primeira = await sstGet<RawPaginado<RawResumoAereoLinha>>("/api/resumos/aereo", {
      ...parametros,
      page: 1,
    });
    const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA_AEREO);
    const paginasRestantes = await Promise.all(
      Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, indice) =>
        sstGet<RawPaginado<RawResumoAereoLinha>>("/api/resumos/aereo", {
          ...parametros,
          page: indice + 2,
        }),
      ),
    );

    const totaisPorHora = new Array(24).fill(0) as number[];
    for (const pagina of [primeira, ...paginasRestantes]) {
      for (const linha of pagina.data) {
        const hora = horaBrasilia(linha.created_at);
        totaisPorHora[hora] = (totaisPorHora[hora] ?? 0) + linha.tarifa;
      }
    }
    return { data: dataIso, totaisPorHora };
  });
}

// Agregados + curva horária de `projecao`. Algoritmo, faixa de confiança
// e forma da curva confirmados pelo PO — ver
// dashboard-vendas.projecao.util.ts.
async function construirProjecaoReal(): Promise<ProjecaoDia> {
  const [amostrasHistoricas, amostraHoje] = await Promise.all([
    Promise.all(mesmasSemanasAnteriores(4).map((data) => buscarAmostraDoDia(data))),
    buscarAmostraDoDia(hojeIso()),
  ]);

  const calculado = calcularProjecaoDoDia(amostrasHistoricas);
  const agora = new Date();

  const amostrasHorarias = await Promise.all(
    calculado.datasMantidas.map((data) => buscarFormaHorariaDoDia(data)),
  );
  const formaMedia = calcularFormaHoraria(amostrasHorarias);
  const horaAtual = horaBrasilia(agora);
  const curva = calcularCurvaHoraria(
    formaMedia,
    calculado.fechamentoEsperado,
    amostraHoje.total,
    horaAtual,
  );

  return {
    fechamentoEsperado: calculado.fechamentoEsperado,
    faixaMin: calculado.faixaMin,
    faixaMax: calculado.faixaMax,
    realizado: amostraHoje.total,
    aEmitir: Math.max(0, calculado.fechamentoEsperado - amostraHoje.total),
    nacional: { projecao: calculado.nacionalProjecao, realizado: amostraHoje.nacional },
    internacional: {
      projecao: calculado.internacionalProjecao,
      realizado: amostraHoje.internacional,
    },
    percentualDiaTranscorrido: calcularPercentualDiaTranscorrido(agora),
    atualizadoEm: agora,
    curva,
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

// `saudePct`/`agenciasMesVarPct` de "ambos" precisam contar cada agência
// uma vez só entre os dois canais (união, não soma — somar `clientes` de
// aéreo + terrestre contaria duas vezes quem vende os dois). O SST ainda
// não expõe um "resumo-agrupado" pronto pro terrestre, mas dá pra chegar
// no mesmo resultado paginando `/api/resumos/terrestre` e reduzindo pra
// um Set no código (ver `codigosAgenciasTerrestre` acima) — por isso os
// campos abaixo já são reais, mesmo sem esse endpoint novo do SST.
async function construirConversao(): Promise<Conversao> {
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
    ativasAmbos30d,
    ativasAmbosMesAtual,
    ativasAmbosMesAnterior,
  ] = await Promise.all([
    buscarAir(inicioMes, hoje),
    buscarAir(anterior.inicio, anterior.fim),
    buscarNonAir(inicioMes, hoje),
    buscarNonAir(anterior.inicio, anterior.fim),
    buscarAir(trintaDiasAtras, hoje),
    buscarNonAir(trintaDiasAtras, hoje),
    totalAgenciasAtivas(),
    contarAgenciasAtivasAmbos(trintaDiasAtras, hoje),
    contarAgenciasAtivasAmbos(inicioMes, hoje),
    contarAgenciasAtivasAmbos(anterior.inicio, anterior.fim),
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
    totalClientes: ativas,
  };

  const terrestre: ConversaoCanal = {
    saudePct: ativas > 0 ? (nonAirUltimos30d.clientes / ativas) * 100 : 0,
    volumeMesVarPct: calcularVariacaoPct(nonAirAtual.tarifa, nonAirAnterior.tarifa),
    bilhetesVendasMesVarPct: calcularVariacaoPct(nonAirAtual.tickets, nonAirAnterior.tickets),
    agenciasMesVarPct: calcularVariacaoPct(nonAirAtual.clientes, nonAirAnterior.clientes),
    periodoComparativo,
    aereoMes,
    terrestreMes,
    totalClientes: ativas,
  };

  const ambos: ConversaoCanal = {
    saudePct: ativas > 0 ? (ativasAmbos30d / ativas) * 100 : 0,
    volumeMesVarPct: calcularVariacaoPct(
      airAtual.tarifa + nonAirAtual.tarifa,
      airAnterior.tarifa + nonAirAnterior.tarifa,
    ),
    bilhetesVendasMesVarPct: calcularVariacaoPct(
      airAtual.tickets + nonAirAtual.tickets,
      airAnterior.tickets + nonAirAnterior.tickets,
    ),
    agenciasMesVarPct: calcularVariacaoPct(ativasAmbosMesAtual, ativasAmbosMesAnterior),
    periodoComparativo,
    aereoMes,
    terrestreMes,
    totalClientes: ativas,
  };

  return { ambos, aereo, terrestre };
}

// =====================================================================
// recencia / cruzamentoCanais
//
// Mesmo princípio de `conversao.ambos` (união de conjuntos aéreo ∪
// terrestre, calculada aqui em vez de vir pronta do SST). Duas
// simplificações reais, aceitas conscientemente (ver docs/faltante.md):
//
// 1. Janela do aéreo = 365 dias (uma chamada só, sem paginação — o
//    `resumo-agrupado` já vem agrupado por empresa). Janela do terrestre
//    = 90 dias, não 365 — paginar 365 dias de terrestre é ~122 páginas
//    (60.904 registros testados contra o SST real), risco real de
//    sobrecarregar o servidor deles mesmo com retry. Decisão explícita:
//    reduzir a janela do terrestre em vez de arriscar. Efeito prático:
//    uma agência cujo único histórico é uma venda terrestre entre 91 e
//    365 dias atrás não aparece nos dados — fica sub-contada nas faixas
//    "90-179"/"180+" e no cruzamento de canais.
// 2. `base-empresa-cadastro` (usado antes como possível "roster completo
//    de agências") **não serve pra isso** — na prática é dominado por
//    outros tipos de empresa (CIA AEREA, HOTEL etc.), só ~0,4% dos
//    registros são de fato `descricao_tipo_empresa = "AGENCIA"` (checado
//    contra o SST real). Por isso a identidade (nome/filial/executivo)
//    aqui vem só de quem aparece nas fontes de venda
//    (`resumo-agrupado`/`agencias/top` pro aéreo, `cliente` do próprio
//    registro bruto pro terrestre) — não existe uma lista de "agências
//    sem nenhuma venda detectada" com identidade conhecida, então
//    `cruzamentoDetalhe.nenhum` fica com contagem real mas lista vazia.
// =====================================================================

const JANELA_AEREO_RECENCIA_DIAS = 365;
const JANELA_TERRESTRE_RECENCIA_DIAS = 90;
const LIMITE_IDENTIDADE_AEREO = 10_000; // cobre o universo testado (5.438 agências/365 dias) numa chamada só.
const TETO_DETALHE = 400; // mesmo teto usado no resto do dashboard (ex.: TAMANHO_RANKING).

function dataIsoDoCampo(valor: string): string {
  return valor.slice(0, 10);
}

function diferencaDias(dataIso: string, referenciaIso: string): number {
  const dataMs = Date.parse(`${dataIso}T00:00:00Z`);
  const referenciaMs = Date.parse(`${referenciaIso}T00:00:00Z`);
  return Math.round((referenciaMs - dataMs) / 86_400_000);
}

function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function maiorDataIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

interface RawResumoAgrupadoCompleto {
  codigo: number;
  nome: string;
  tarifa: number;
  quantidade_bilhetes: number;
  data_ultima_venda: string;
}

interface RawResumoTerrestreLinhaCompleta {
  codigo_cliente: number;
  cliente: string;
  tarifa_cliente: number;
  data: string;
}

// GET /api/agencias/top só pra pegar identidade (base/executivo) — já é
// usado em `rankingPorPeriodo` com janelas de dia/mês/ano; aqui pedimos os
// últimos 365 dias inteiros, numa chamada só (testado: 5.438 linhas, sem
// paginar).
interface RawIdentidadeAerea {
  codigo_empresa: number;
  codigo_base: string;
  nome_executivo: string;
}

interface DadosPorAgencia {
  nome: string;
  valor: number;
  qtd: number;
  ultima: string;
}

async function buscarAereoJanela(dias: number): Promise<Map<number, DadosPorAgencia>> {
  const inicio = diasAtrasIso(dias);
  const hoje = hojeIso();
  return comCache(`aereo-janela:${dias}:${hoje}`, async () => {
    const linhas = await sstGet<RawResumoAgrupadoCompleto[]>(
      "/api/consolidado/air/resumo-agrupado",
      {
        agruparPor: "codigoEmpresa",
        startDate: inicio,
        endDate: hoje,
      },
    );
    const mapa = new Map<number, DadosPorAgencia>();
    for (const linha of linhas) {
      mapa.set(linha.codigo, {
        nome: linha.nome,
        valor: linha.tarifa,
        qtd: linha.quantidade_bilhetes,
        ultima: dataIsoDoCampo(linha.data_ultima_venda),
      });
    }
    return mapa;
  });
}

async function buscarTerrestreJanela(dias: number): Promise<Map<number, DadosPorAgencia>> {
  const inicio = diasAtrasIso(dias);
  const hoje = hojeIso();
  return comCache(`terrestre-janela:${dias}:${hoje}`, async () => {
    const primeira = await sstGet<RawPaginado<RawResumoTerrestreLinhaCompleta>>(
      "/api/resumos/terrestre",
      { startDate: inicio, endDate: hoje, page: 1, limit: LIMITE_PAGINA_TERRESTRE },
    );
    const totalPaginas = Math.ceil(primeira.total / LIMITE_PAGINA_TERRESTRE);
    const paginasRestantes = await Promise.all(
      Array.from({ length: Math.max(0, totalPaginas - 1) }, (_, indice) =>
        sstGet<RawPaginado<RawResumoTerrestreLinhaCompleta>>("/api/resumos/terrestre", {
          startDate: inicio,
          endDate: hoje,
          page: indice + 2,
          limit: LIMITE_PAGINA_TERRESTRE,
        }),
      ),
    );

    const mapa = new Map<number, DadosPorAgencia>();
    for (const pagina of [primeira, ...paginasRestantes]) {
      for (const linha of pagina.data) {
        const dataLinha = dataIsoDoCampo(linha.data);
        const atual = mapa.get(linha.codigo_cliente);
        if (atual) {
          atual.valor += linha.tarifa_cliente;
          atual.qtd += 1;
          atual.ultima = maiorDataIso(atual.ultima, dataLinha)!;
        } else {
          mapa.set(linha.codigo_cliente, {
            nome: linha.cliente,
            valor: linha.tarifa_cliente,
            qtd: 1,
            ultima: dataLinha,
          });
        }
      }
    }
    return mapa;
  });
}

async function buscarIdentidadeAerea(
  dias: number,
): Promise<Map<number, { filial: string; executivo: string }>> {
  const inicio = diasAtrasIso(dias);
  const hoje = hojeIso();
  return comCache(`identidade-aereo:${dias}:${hoje}`, async () => {
    const resposta = await sstGet<RawPaginado<RawIdentidadeAerea>>("/api/agencias/top", {
      startDate: inicio,
      endDate: hoje,
      limit: LIMITE_IDENTIDADE_AEREO,
    });
    const mapa = new Map<number, { filial: string; executivo: string }>();
    for (const linha of resposta.data) {
      mapa.set(linha.codigo_empresa, {
        filial: linha.codigo_base,
        executivo: linha.nome_executivo,
      });
    }
    return mapa;
  });
}

interface AgenciaComputada {
  codigo: number;
  nome: string;
  // "—" quando a agência só aparece no lado terrestre — `agencias/top`
  // (fonte de identidade) só cobre quem vendeu aéreo. Ver comentário no
  // topo desta seção.
  filial: string;
  executivo: string;
  aereoValor: number;
  aereoQtd: number;
  aereoUltima: string | null;
  terrestreValor: number;
  terrestreQtd: number;
  terrestreUltima: string | null;
}

async function construirAgenciasComputadas(): Promise<AgenciaComputada[]> {
  const [aereo, terrestre, identidade] = await Promise.all([
    buscarAereoJanela(JANELA_AEREO_RECENCIA_DIAS),
    buscarTerrestreJanela(JANELA_TERRESTRE_RECENCIA_DIAS),
    buscarIdentidadeAerea(JANELA_AEREO_RECENCIA_DIAS),
  ]);

  const codigos = new Set<number>([...aereo.keys(), ...terrestre.keys()]);
  return Array.from(codigos, (codigo): AgenciaComputada => {
    const dadosAereo = aereo.get(codigo);
    const dadosTerrestre = terrestre.get(codigo);
    const dadosIdentidade = identidade.get(codigo);
    return {
      codigo,
      nome: dadosAereo?.nome ?? dadosTerrestre?.nome ?? `Agência ${codigo}`,
      filial: dadosIdentidade?.filial ?? "—",
      executivo: dadosIdentidade?.executivo ?? "—",
      aereoValor: dadosAereo?.valor ?? 0,
      aereoQtd: dadosAereo?.qtd ?? 0,
      aereoUltima: dadosAereo?.ultima ?? null,
      terrestreValor: dadosTerrestre?.valor ?? 0,
      terrestreQtd: dadosTerrestre?.qtd ?? 0,
      terrestreUltima: dadosTerrestre?.ultima ?? null,
    };
  });
}

function ultimaVendaDe(agencia: AgenciaComputada): string | null {
  return maiorDataIso(agencia.aereoUltima, agencia.terrestreUltima);
}

function canalHistorico(agencia: AgenciaComputada): Canal {
  if (agencia.aereoUltima && agencia.terrestreUltima) return "ambos";
  if (agencia.terrestreUltima) return "terrestre";
  return "aereo";
}

function construirGrupoRecencia(itens: AgenciaComputada[]): GrupoRecencia {
  return {
    total: itens.length,
    soAereo: itens.filter((item) => canalHistorico(item) === "aereo").length,
    soTerrestre: itens.filter((item) => canalHistorico(item) === "terrestre").length,
    ambos: itens.filter((item) => canalHistorico(item) === "ambos").length,
  };
}

function paraAgenciaRecenciaDetalhe(
  agencia: AgenciaComputada,
  hoje: string,
): AgenciaRecenciaDetalhe {
  const ultima = ultimaVendaDe(agencia)!;
  return {
    nome: agencia.nome,
    // Sem CNPJ nas fontes usadas aqui (`resumo-agrupado`/`resumos/
    // terrestre` não trazem esse campo) — ver docs/faltante.md.
    cnpj: "",
    filial: agencia.filial,
    executivo: agencia.executivo,
    // Hierarquia Executivo→Gestor só existe no banco deste projeto
    // (Promotor→Gestor), não no SST — não cruzado nesta rodada.
    gestor: "—",
    canal: canalHistorico(agencia),
    ultimaVenda: formatarDataBr(ultima),
    dias: diferencaDias(ultima, hoje),
    aereo365d: agencia.aereoValor,
    terrestre365d: agencia.terrestreValor,
  };
}

async function construirRecencia(agencias: AgenciaComputada[]): Promise<{
  recencia: RecenciaAgencias;
  recenciaDetalhe: Record<ChaveRecencia, AgenciaRecenciaDetalhe[]>;
}> {
  const hoje = hojeIso();
  const anoAtual = hoje.slice(0, 4);
  const anoAnteriorNum = Number(anoAtual) - 1;

  const comVenda = agencias
    .map((agencia) => ({ agencia, ultima: ultimaVendaDe(agencia) }))
    .filter((item): item is { agencia: AgenciaComputada; ultima: string } => item.ultima !== null);

  const compraram30dItens = comVenda
    .filter((item) => diferencaDias(item.ultima, hoje) <= 30)
    .map((item) => item.agencia);
  const faixa31a89Itens = comVenda
    .filter((item) => {
      const dias = diferencaDias(item.ultima, hoje);
      return dias > 30 && dias <= 89;
    })
    .map((item) => item.agencia);
  const faixa90a179Itens = comVenda
    .filter((item) => {
      const dias = diferencaDias(item.ultima, hoje);
      return dias > 89 && dias <= 179;
    })
    .map((item) => item.agencia);
  const faixa180MaisItens = comVenda
    .filter((item) => diferencaDias(item.ultima, hoje) > 179)
    .map((item) => item.agencia);
  const semVendas30dMaisItens = [...faixa31a89Itens, ...faixa90a179Itens, ...faixa180MaisItens];

  // "Comprou este ano" — funciona porque a janela aérea (365 dias) já
  // cobre qualquer data de janeiro em diante; o corte de calendário
  // (ano civil) é aplicado aqui comparando o prefixo AAAA da data.
  const compraramAnoItens = comVenda
    .filter((item) => item.ultima.slice(0, 4) === anoAtual)
    .map((item) => item.agencia);

  // Churn (comprou ano anterior, não comprou este ano) — só aéreo: pra
  // cobrir o ano anterior inteiro precisaria de +1 ano de terrestre
  // paginado (dobra o custo já alto da janela reduzida) — decisão
  // explícita de escopo, ver docs/faltante.md.
  const aereoAnoAnterior = await comCache(`aereo-ano-anterior:${anoAnteriorNum}`, () =>
    sstGet<RawResumoAgrupadoCompleto[]>("/api/consolidado/air/resumo-agrupado", {
      agruparPor: "codigoEmpresa",
      startDate: `${anoAnteriorNum}-01-01`,
      endDate: `${anoAnteriorNum}-12-31`,
    }),
  );
  const codigosAnoAtual = new Set(compraramAnoItens.map((agencia) => agencia.codigo));
  const churnLinhas = aereoAnoAnterior.filter((linha) => !codigosAnoAtual.has(linha.codigo));

  const recencia: RecenciaAgencias = {
    compraram30d: construirGrupoRecencia(compraram30dItens),
    compraramAno: construirGrupoRecencia(compraramAnoItens),
    semVendas30dMais: {
      total: semVendas30dMaisItens.length,
      faixa31a89: faixa31a89Itens.length,
      faixa90a179: faixa90a179Itens.length,
      faixa180Mais: faixa180MaisItens.length,
    },
    semVendasAno: {
      // Detectado só via aéreo (ver comentário acima) — soAereo carrega
      // o total todo, soTerrestre/ambos ficam em 0 (não fabricado).
      total: churnLinhas.length,
      soAereo: churnLinhas.length,
      soTerrestre: 0,
      ambos: 0,
      compraramAnoAnterior: aereoAnoAnterior.length,
      compraramAnoAtual: compraramAnoItens.length,
      soAnoAnterior: churnLinhas.length,
    },
  };

  const paraDetalheChurn = (linha: RawResumoAgrupadoCompleto): AgenciaRecenciaDetalhe => {
    const ultima = dataIsoDoCampo(linha.data_ultima_venda);
    return {
      nome: linha.nome,
      cnpj: "",
      filial: "—",
      executivo: "—",
      gestor: "—",
      canal: "aereo",
      ultimaVenda: formatarDataBr(ultima),
      dias: diferencaDias(ultima, hoje),
      aereo365d: linha.tarifa,
      terrestre365d: 0,
    };
  };

  const recenciaDetalhe: Record<ChaveRecencia, AgenciaRecenciaDetalhe[]> = {
    compraram30d: compraram30dItens
      .slice(0, TETO_DETALHE)
      .map((a) => paraAgenciaRecenciaDetalhe(a, hoje)),
    compraramAno: compraramAnoItens
      .slice(0, TETO_DETALHE)
      .map((a) => paraAgenciaRecenciaDetalhe(a, hoje)),
    semVendas30dMais: semVendas30dMaisItens
      .slice(0, TETO_DETALHE)
      .map((a) => paraAgenciaRecenciaDetalhe(a, hoje)),
    semVendasAno: churnLinhas.slice(0, TETO_DETALHE).map(paraDetalheChurn),
  };

  return { recencia, recenciaDetalhe };
}

async function construirCruzamento(agencias: AgenciaComputada[]): Promise<{
  cruzamentoCanais: CruzamentoCanais;
  cruzamentoDetalhe: Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]>;
}> {
  const totalCarteira = await totalAgenciasAtivas();

  const ambosItens = agencias.filter((a) => a.aereoUltima && a.terrestreUltima);
  const soAereoItens = agencias.filter((a) => a.aereoUltima && !a.terrestreUltima);
  const soTerrestreItens = agencias.filter((a) => !a.aereoUltima && a.terrestreUltima);
  const nenhumQtd = Math.max(
    0,
    totalCarteira - ambosItens.length - soAereoItens.length - soTerrestreItens.length,
  );

  const comPct = (qtd: number) => ({
    qtd,
    pct: totalCarteira > 0 ? (qtd / totalCarteira) * 100 : 0,
  });

  const cruzamentoCanais: CruzamentoCanais = {
    totalAgenciasCarteira: totalCarteira,
    ambos: comPct(ambosItens.length),
    soAereo: comPct(soAereoItens.length),
    soTerrestre: comPct(soTerrestreItens.length),
    nenhum: comPct(nenhumQtd),
  };

  const paraDetalhe = (agencia: AgenciaComputada): AgenciaCruzamentoDetalhe => ({
    nome: agencia.nome,
    cnpj: "",
    base: agencia.filial,
    executivo: agencia.executivo,
    bilhetesAereo: agencia.aereoQtd,
    aereo365d: agencia.aereoValor,
    vendasTerrestre: agencia.terrestreQtd,
    terrestre365d: agencia.terrestreValor,
    ultimaAereo: agencia.aereoUltima ? formatarDataBr(agencia.aereoUltima) : null,
    ultimaTerrestre: agencia.terrestreUltima ? formatarDataBr(agencia.terrestreUltima) : null,
  });

  const cruzamentoDetalhe: Record<ChaveCruzamento, AgenciaCruzamentoDetalhe[]> = {
    ambos: ambosItens.slice(0, TETO_DETALHE).map(paraDetalhe),
    soAereo: soAereoItens.slice(0, TETO_DETALHE).map(paraDetalhe),
    soTerrestre: soTerrestreItens.slice(0, TETO_DETALHE).map(paraDetalhe),
    // Sem identidade de agências com zero venda detectada nas janelas
    // usadas (365d aéreo / 90d terrestre) — só a contagem é real (por
    // subtração), a lista de detalhe fica vazia. Ver docs/faltante.md.
    nenhum: [],
  };

  return { cruzamentoCanais, cruzamentoDetalhe };
}

// Só pra teste — limpa o cache em memória entre casos, já que ele é
// module-scoped e sobreviveria entre `it()`s do mesmo arquivo de teste.
export function __limparCacheParaTestes(): void {
  cacheConsolidado.clear();
}

// Seções "rápidas" — poucas chamadas, sem paginação. Separado do resto
// pra poder ser exibido (via Suspense, ver crm/dashboard/page.tsx)
// enquanto as seções pesadas abaixo ainda carregam.
async function obterResumoEDia(): Promise<
  Pick<
    DashboardVendasData,
    | "resumoPorPeriodo"
    | "miniKpis"
    | "rankingPorPeriodo"
    | "fornecedoresPorPeriodo"
    | "nacionalInternacionalPorMes"
  >
> {
  const hoje = hojeIso();
  const ontem = ontemIso();
  const anoAnterior = mesmoDiaAnoAnteriorIso();
  const inicioMes = inicioMesIso();
  const inicioAno = inicioAnoIso();

  const [
    overviewHoje,
    overviewOntem,
    overviewAnoAnterior,
    topAgenciasHoje,
    topAgenciasOntem,
    topAgenciasMes,
    topAgenciasAno,
    rankingCiasHoje,
    rankingCiasOntem,
    rankingCiasMes,
    rankingCiasAno,
    nacIntMes,
    nacIntAno,
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
    // Ponto de comparação "LY" (last-year) de margem/rentabilidade real —
    // mesma data de calendário, 1 ano atrás. Só uma chamada: "ontem"
    // reaproveita o mesmo ponto LY de "dia" (mesma simplificação de
    // executivo-dashboard.sst-service.ts — não existe um "mesmo dia 1 ano
    // atrás, menos 1 dia" barato de buscar).
    sstGet<RawOverviewResponse>("/api/consolidado/overview", {
      data: anoAnterior,
      painel: "FILIAL",
      situacao: "ATIVOS",
    }),
    // Ranking de um dia só (startDate = endDate) — antes só existiam as
    // janelas mês-a-data/ano-a-data; filtro do cabeçalho passou a dirigir
    // também os rankings (pedido do usuário, 2026-08-20), então precisa
    // de um dado por dia igual o overview já tinha.
    sstGet<RawPaginado<RawTopAgencia>>("/api/agencias/top", {
      startDate: hoje,
      endDate: hoje,
      limit: TAMANHO_RANKING,
    }),
    sstGet<RawPaginado<RawTopAgencia>>("/api/agencias/top", {
      startDate: ontem,
      endDate: ontem,
      limit: TAMANHO_RANKING,
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
      startDate: hoje,
      endDate: hoje,
      limit: TAMANHO_RANKING_FORNECEDORES,
    }),
    sstGet<RawPaginado<RawRankingCia>>("/api/reports/ranking-cias", {
      startDate: ontem,
      endDate: ontem,
      limit: TAMANHO_RANKING_FORNECEDORES,
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
    // `buscarNacInt` (não `sstGet` direto) de propósito: o mês corrente
    // aqui é o mesmo intervalo que `construirVendasMensais` pede pro mês
    // em curso (ver docs/optimize.md, ponto 2) — passando pelo `comCache`
    // os dois reaproveitam a mesma resposta em vez de duplicar a chamada.
    // Hoje/ontem não precisam de chamada equivalente: o `nacInter` já vem
    // embutido em /api/consolidado/overview (confirmado 2026-08-19), ver
    // paraNacIntDoOverview.
    buscarNacInt(inicioMes, hoje),
    buscarNacInt(inicioAno, hoje),
  ]);

  return {
    resumoPorPeriodo: {
      hoje: paraResumoDia(overviewHoje, overviewAnoAnterior, "dia"),
      ontem: paraResumoDia(overviewOntem, overviewAnoAnterior, "dia"),
      mes: paraResumoDia(overviewHoje, overviewAnoAnterior, "mes"),
      ano: paraResumoDia(overviewHoje, overviewAnoAnterior, "ano"),
    },
    miniKpis: paraMiniKpisPorPeriodo(overviewHoje, overviewOntem),
    rankingPorPeriodo: {
      hoje: paraTopAgencias(topAgenciasHoje.data),
      ontem: paraTopAgencias(topAgenciasOntem.data),
      mes: paraTopAgencias(topAgenciasMes.data),
      ano: paraTopAgencias(topAgenciasAno.data),
    },
    fornecedoresPorPeriodo: {
      hoje: paraTopFornecedores(rankingCiasHoje.data),
      ontem: paraTopFornecedores(rankingCiasOntem.data),
      mes: paraTopFornecedores(rankingCiasMes.data),
      ano: paraTopFornecedores(rankingCiasAno.data),
    },
    nacionalInternacionalPorMes: {
      mes: paraNacionalInternacional(nacIntMes.data),
      ano: paraNacionalInternacional(nacIntAno.data),
    },
  };
}

// Filtro "Personalizado" do cabeçalho — diferente de `obterResumoEDia`
// (4 períodos fixos, pré-computados no carregamento da página), este é
// buscado sob demanda pelo client via Server Action
// (dashboard-vendas.actions.ts) quando o usuário aplica um intervalo no
// calendário, porque não dá pra pré-computar todo intervalo possível.
// Usa `/api/consolidado/overview-intervalo` (pedido ao SST nesta rodada,
// ver docs/filtro-personalizado.md) pro resumo/miniKpis, e os mesmos
// `/api/agencias/top`/`/api/reports/ranking-cias` já usados pra "mês"/
// "ano" em `obterResumoEDia` (já aceitavam `startDate`/`endDate`
// arbitrário, sem mudança nenhuma). Sem fallback pra mock aqui de
// propósito: um erro numa consulta sob demanda deve aparecer pro usuário
// (ver dashboard-vendas.actions.ts), não virar silenciosamente o dado de
// outro período.
async function obterResumoPersonalizado(
  inicioIso: string,
  fimIso: string,
): Promise<ResumoPersonalizado> {
  const { inicio: inicioLY, fim: fimLY } = mesmoIntervaloAnoAnteriorIso(inicioIso, fimIso);

  const [overviewAtual, overviewLY, topAgencias, rankingCias] = await Promise.all([
    sstGet<RawOverviewIntervaloResponse>("/api/consolidado/overview-intervalo", {
      startDate: inicioIso,
      endDate: fimIso,
      painel: "FILIAL",
      situacao: "ATIVOS",
    }),
    sstGet<RawOverviewIntervaloResponse>("/api/consolidado/overview-intervalo", {
      startDate: inicioLY,
      endDate: fimLY,
      painel: "FILIAL",
      situacao: "ATIVOS",
    }),
    sstGet<RawPaginado<RawTopAgencia>>("/api/agencias/top", {
      startDate: inicioIso,
      endDate: fimIso,
      limit: TAMANHO_RANKING,
    }),
    sstGet<RawPaginado<RawRankingCia>>("/api/reports/ranking-cias", {
      startDate: inicioIso,
      endDate: fimIso,
      limit: TAMANHO_RANKING_FORNECEDORES,
    }),
  ]);

  return {
    resumo: paraResumoIntervalo(overviewAtual, overviewLY),
    miniKpis: paraMiniKpis(overviewAtual.filial.aereo),
    ranking: paraTopAgencias(topAgencias.data),
    fornecedores: paraTopFornecedores(rankingCias.data),
  };
}

// Diferente das outras seções pesadas (projeção, vendas mensais/diárias,
// conversão, recência×cruzamento — todas com sua própria *ComFallback*
// logo abaixo), `obterResumoEDia` ficava SEM proteção — um 500 real do
// SST aqui (ex.: "[sica] rawQuery failed", visto em produção 2026-08-25)
// derrubava a página inteira com um Unhandled Runtime Error em vez de só
// degradar essa seção pro mock. É a seção mais pesada (13 chamadas
// concorrentes ao SST — overview (hoje/ontem/ano anterior), top-agências,
// ranking-cias, nac/int) e
// a primeira da fila (`depoisDe`, ver dashboard-vendas-view.tsx), então
// era também a mais provável de falhar sob esse volume.
async function obterResumoEDiaComFallback(): Promise<
  Pick<
    DashboardVendasData,
    | "resumoPorPeriodo"
    | "miniKpis"
    | "rankingPorPeriodo"
    | "fornecedoresPorPeriodo"
    | "nacionalInternacionalPorMes"
  >
> {
  return comFallback("resumoEDia", obterResumoEDia(), resumoEDiaVazio());
}

async function obterProjecaoComFallback(): Promise<ProjecaoDia> {
  return comFallback("projecao", construirProjecaoReal(), projecaoVazia());
}

async function obterVendasMensaisComFallback(): Promise<VendaMensal[]> {
  return comFallback("vendasMensais", construirVendasMensais(), []);
}

async function obterVendasDiariasComFallback(): Promise<VendaDiaria[]> {
  return comFallback("vendasDiarias", construirVendasDiarias(), []);
}

async function obterConversaoComFallback(): Promise<Conversao> {
  return comFallback("conversao", construirConversao(), conversaoVazia());
}

async function obterRecenciaECruzamentoComFallback(): Promise<
  Pick<
    DashboardVendasData,
    "recencia" | "recenciaDetalhe" | "cruzamentoCanais" | "cruzamentoDetalhe"
  >
> {
  return comFallback(
    "recencia/cruzamentoCanais",
    (async () => {
      const agenciasComputadas = await construirAgenciasComputadas();
      const [recenciaResultado, cruzamentoResultado] = await Promise.all([
        construirRecencia(agenciasComputadas),
        construirCruzamento(agenciasComputadas),
      ]);
      return {
        recencia: recenciaResultado.recencia,
        recenciaDetalhe: recenciaResultado.recenciaDetalhe,
        cruzamentoCanais: cruzamentoResultado.cruzamentoCanais,
        cruzamentoDetalhe: cruzamentoResultado.cruzamentoDetalhe,
      };
    })(),
    recenciaECruzamentoVazio(),
  );
}

export const dashboardVendasSstService = {
  obterResumoEDia: obterResumoEDiaComFallback,
  obterResumoPersonalizado,
  obterVendasMensais: obterVendasMensaisComFallback,
  obterVendasDiarias: obterVendasDiariasComFallback,
  obterConversao: obterConversaoComFallback,
  obterRecenciaECruzamento: obterRecenciaECruzamentoComFallback,
  obterProjecao: obterProjecaoComFallback,

  // Mantido pra quem ainda quer tudo de uma vez (testes, scripts) — por
  // baixo dos panos já é só a composição das peças acima, cada uma com
  // seu próprio fallback isolado (ver `comFallback`).
  async obterDashboard(): Promise<DashboardVendasData> {
    const [mockEstatico, resumoEDia, vendasMensais, vendasDiarias, conversao, recenciaECruzamento] =
      await Promise.all([
        dashboardVendasMockService.obterDashboard(),
        obterResumoEDiaComFallback(),
        obterVendasMensaisComFallback(),
        obterVendasDiariasComFallback(),
        obterConversaoComFallback(),
        obterRecenciaECruzamentoComFallback(),
      ]);

    return {
      ...mockEstatico,
      ...resumoEDia,
      vendasMensais,
      vendasDiarias,
      conversao,
      ...recenciaECruzamento,
    };
  },
};

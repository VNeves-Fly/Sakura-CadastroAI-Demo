import {
  requireSstApiKey,
  sstBaseUrl,
} from "@/modules/cadastro/infrastructure/adapters/flysakura-sst-http.util";
import { valkeyGet, valkeySet } from "@/modules/dashboard-vendas/infrastructure/valkey-cache.util";
import { executivoDashboardMockService } from "@/modules/atribuicoes/services/executivo-dashboard.mock-service";
import type {
  AgenciaCarteiraResumo,
  AgenciaSegmentoResumo,
  CanalAgenciaCarteira,
  ExecutivoAgenciaResumo,
  ExecutivoDashboard,
  FaixaRecenciaAgencia,
  KpisSecundarios,
  MiniStats,
  SegmentoSaude,
  VendasMesHero,
} from "@/modules/atribuicoes/types/executivo-detalhe.types";

// Integração real com o SST (sst.flysakura.com) filtrada por
// `codigoExecutivo` (= Promotor.sica) pra montar o dashboard de UM
// executivo — irmã de dashboard-vendas.sst-service.ts (mesmo backend,
// mesmo padrão de cache/fallback), mas não reaproveita o código de lá:
// nenhuma das funções internas daquele arquivo é exportada, e a
// necessidade de filtrar por executivo muda a estratégia de algumas
// seções (ver comentários abaixo, especialmente crossCanal). Validado por
// curl direto contra o SST antes de escrever isto — ver
// docs/mock-exec-resp.md e o plano de implementação.
//
// Achado importante (curl, 2026-08-20): `/api/resumos/terrestre` ACEITA
// `codigoExecutivo` na spec, mas IGNORA o parâmetro na prática (testado
// com um código inexistente e o total bate igual ao dataset inteiro) —
// por isso a atividade terrestre por agência aqui usa
// `/api/consolidado/non-air?codigoEmpresa=X` (agregado, esse sim filtra
// certo) em vez da listagem bruta. `/api/reports/ranking-cias` também não
// filtra por executivo — `fidelidadePorCompanhia` continua mock.
//
// Duas funções expostas (`obterHeroKpis`/`obterCrossCanalEMiniStats`), não
// uma só `obterDashboard` — pedido do usuário (2026-08-20): a página
// `/crm/executivos/:id` estava demorando muito pra abrir porque esperava
// as duas seções (rápida + pesada) resolverem juntas antes de renderizar
// qualquer coisa. Separadas, o controller/view (ver
// executivo-dashboard.controller.ts e executivo-dashboard-view.tsx) pode
// mostrar hero+kpis assim que prontos e só a seção de crossCanal (a mais
// pesada, por causa do loop por agência) fica atrás de Suspense — mesma
// filosofia de streaming progressivo do dashboard-vendas.sst-service.ts.
//
// `vendasMensais`/`tendencia30d`/`topAgenciasMes`/`topAgenciasAno` NÃO são
// computados aqui (ficam mock, via `...mock` no retorno) — nenhum
// componente em `components/executivo/dashboard/` consome esses campos
// hoje (só existem no tipo `ExecutivoDashboard`), então buscá-los de
// verdade seria ~78 chamadas ao SST por carregamento sem nenhum ganho
// visível — era a maior fatia do tempo de carregamento reportado como
// lento. As queries (nacional-vs-internacional por mês, air/non-air por
// dia, top-clientes) continuam documentadas no plano de implementação;
// reintroduzir quando um card de verdade existir pra esses dados.

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

// Mesmo critério de retry de dashboard-vendas.sst-service.ts: só em 5xx
// (erro do servidor, vale tentar de novo), nunca em 4xx (erro nosso de
// parâmetro).
const TENTATIVAS_5XX = 3;

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

// Degrada uma seção pro mock em vez de derrubar a página inteira — mesmo
// padrão de dashboard-vendas.sst-service.ts.
async function comFallback<T>(rotulo: string, tarefa: Promise<T>, valorMock: T): Promise<T> {
  try {
    return await tarefa;
  } catch (erro) {
    console.error(
      `[executivo-dashboard] "${rotulo}" falhou contra o SST — usando mock só nesta seção.`,
      erro,
    );
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
// ajuste se o mês anterior for mais curto) — mesma convenção de
// dashboard-vendas.sst-service.ts (mês-a-data, não mês fechado).
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

function calcularVariacaoPct(atual: number, anterior: number): number {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : 0;
}

interface RawPeriodoOverview {
  tarifa: number;
  clientes: number;
  tickets: number;
}
interface RawCanalOverview {
  dia: RawPeriodoOverview;
  mes: RawPeriodoOverview;
  ano: RawPeriodoOverview;
}
interface RawOverviewResponse {
  filial: { total: RawCanalOverview };
}

interface RawConsolidadoPeriodo {
  tarifa: number;
  clientes: number;
  tickets: number;
}

interface RawPaginado<T> {
  data: T[];
  total: number;
}

interface RawResumoAgrupadoLinha {
  codigo: number;
  nome: string;
  tarifa: number;
  quantidade_bilhetes: number;
}

interface RawAgenciaAtiva {
  codigo_empresa: number;
  nome: string;
  cnpj: string;
  empresa_status: string;
}

async function buscarOverview(data: string, codigoExecutivo: number): Promise<RawOverviewResponse> {
  return comCache(`exec:${codigoExecutivo}:overview:${data}`, () =>
    sstGet<RawOverviewResponse>("/api/consolidado/overview", {
      data,
      codigoExecutivo,
      painel: "FILIAL",
      situacao: "ATIVOS",
    }),
  );
}

async function buscarAir(
  inicio: string,
  fim: string,
  codigoExecutivo: number,
  codigoEmpresa?: number,
): Promise<RawConsolidadoPeriodo> {
  const chave = `exec:${codigoExecutivo}:air:${codigoEmpresa ?? "-"}:${inicio}:${fim}`;
  return comCache(chave, () =>
    sstGet<RawConsolidadoPeriodo>("/api/consolidado/air", {
      startDate: inicio,
      endDate: fim,
      codigoExecutivo,
      codigoEmpresa,
      painel: "FILIAL",
      status: "ATIVOS",
    }),
  );
}

async function buscarNonAir(
  inicio: string,
  fim: string,
  codigoExecutivo: number,
  codigoEmpresa?: number,
): Promise<RawConsolidadoPeriodo> {
  const chave = `exec:${codigoExecutivo}:nonair:${codigoEmpresa ?? "-"}:${inicio}:${fim}`;
  return comCache(chave, () =>
    sstGet<RawConsolidadoPeriodo>("/api/consolidado/non-air", {
      startDate: inicio,
      endDate: fim,
      codigoExecutivo,
      codigoEmpresa,
      painel: "FILIAL",
      status: "ATIVOS",
    }),
  );
}

// `/api/agencias/ativas?codigoExecutivo=X` — roster completo da carteira
// (confirmado por curl: filtra certo e já traz CNPJ, diferente do que
// `docs/mock-exec-resp.md` supunha ser um bloqueio de dado ausente).
// `limit` alto cobre carteiras normais numa chamada só; carteiras muito
// grandes (>500 agências) precisariam de paginação — não visto em nenhum
// executivo real testado.
const LIMITE_ROSTER = 500;

async function buscarRoster(codigoExecutivo: number): Promise<RawAgenciaAtiva[]> {
  return comCache(`exec:${codigoExecutivo}:roster`, async () => {
    const resposta = await sstGet<RawPaginado<RawAgenciaAtiva>>("/api/agencias/ativas", {
      codigoExecutivo,
      limit: LIMITE_ROSTER,
    });
    return resposta.data;
  });
}

async function buscarAereoAgrupado(
  codigoExecutivo: number,
  inicio: string,
  fim: string,
): Promise<Map<number, { tarifa: number; qtd: number }>> {
  return comCache(`exec:${codigoExecutivo}:aereo-agrupado:${inicio}:${fim}`, async () => {
    const linhas = await sstGet<RawResumoAgrupadoLinha[]>("/api/consolidado/air/resumo-agrupado", {
      agruparPor: "codigoEmpresa",
      codigoExecutivo,
      startDate: inicio,
      endDate: fim,
      status: "ATIVOS",
    });
    return new Map(
      linhas.map((linha) => [
        linha.codigo,
        { tarifa: linha.tarifa, qtd: linha.quantidade_bilhetes },
      ]),
    );
  });
}

// Não existe endpoint agrupado por executivo pro terrestre que funcione
// (ver comentário no topo do arquivo) — enumera a carteira via roster e
// consulta o agregado (não a listagem bruta) por agência. Custo
// proporcional ao tamanho da carteira (dezenas de chamadas típicas), não
// ao dataset inteiro do SICA/SIGOT.
async function buscarTerrestrePorAgencia(
  codigoExecutivo: number,
  codigosEmpresa: number[],
  inicio: string,
  fim: string,
): Promise<Map<number, { tarifa: number; qtd: number }>> {
  const resultado = new Map<number, { tarifa: number; qtd: number }>();
  const respostas = await Promise.all(
    codigosEmpresa.map((codigoEmpresa) =>
      buscarNonAir(inicio, fim, codigoExecutivo, codigoEmpresa),
    ),
  );
  codigosEmpresa.forEach((codigoEmpresa, indice) => {
    const resposta = respostas[indice]!;
    if (resposta.tickets > 0 || resposta.tarifa > 0) {
      resultado.set(codigoEmpresa, { tarifa: resposta.tarifa, qtd: resposta.tickets });
    }
  });
  return resultado;
}

async function construirHeroEKpis(
  codigoExecutivo: number,
): Promise<{ hero: ExecutivoDashboard["hero"]; kpis: KpisSecundarios }> {
  const hoje = hojeIso();
  const ontem = ontemIso();
  const janela = janelaMesAnterior();
  const trintaDiasAtras = diasAtrasIso(30);

  const [overviewHoje, overviewOntem, airMesAnterior, nonAirMesAnterior, air30d, nonAir30d] =
    await Promise.all([
      buscarOverview(hoje, codigoExecutivo),
      buscarOverview(ontem, codigoExecutivo),
      buscarAir(janela.inicio, janela.fim, codigoExecutivo),
      buscarNonAir(janela.inicio, janela.fim, codigoExecutivo),
      buscarAir(trintaDiasAtras, hoje, codigoExecutivo),
      buscarNonAir(trintaDiasAtras, hoje, codigoExecutivo),
    ]);

  const { dia, mes, ano } = overviewHoje.filial.total;
  const diaOntem = overviewOntem.filial.total.dia;
  const mesAnteriorValor = airMesAnterior.tarifa + nonAirMesAnterior.tarifa;

  // `variacaoPct` do dia vem de dia-vs-ontem; mês vem de mês-a-data vs.
  // mesma janela do mês anterior (mesmo dado de `mesAnteriorValor`). Ano
  // reaproveita a variação do mês (não existe "ano anterior" buscado aqui)
  // — mesma simplificação que o mock fazia (um valor só pra todo o card),
  // documentada em vez de escondida.
  const variacaoDia = calcularVariacaoPct(dia.tarifa, diaOntem.tarifa);
  const variacaoMes = calcularVariacaoPct(mes.tarifa, mesAnteriorValor);

  const periodo = (p: RawPeriodoOverview, variacaoPct: number): VendasMesHero => ({
    valor: p.tarifa,
    bilhetes: p.tickets,
    agenciasVendendo: p.clientes,
    variacaoPct,
  });

  const valor30d = air30d.tarifa + nonAir30d.tarifa;
  const tickets30d = air30d.tickets + nonAir30d.tickets;

  return {
    hero: {
      dia: periodo(dia, variacaoDia),
      ontem: periodo(diaOntem, variacaoDia),
      mes: periodo(mes, variacaoMes),
      ano: periodo(ano, variacaoMes),
    },
    kpis: {
      mesAnteriorValor,
      mesAnteriorFaltaValor: Math.max(0, mesAnteriorValor - mes.tarifa),
      mesAnteriorPercentualAtingido:
        mesAnteriorValor > 0 ? Math.round((mes.tarifa / mesAnteriorValor) * 100) : 0,
      // TODO(mock): projeção de fim de mês depende do mesmo algoritmo
      // ainda não definido pro dashboard geral (docs/faltante.md) — fora
      // de escopo aqui, preenchido pelo caller com o valor mock.
      projecaoFimMes: 0,
      acumuladoAnoValor: ano.tarifa,
      acumuladoAnoBilhetes: ano.tickets,
      ticketMedio30d: tickets30d > 0 ? Math.round(valor30d / tickets30d) : 0,
    },
  };
}

function paraAgenciaSegmento(
  codigo: number,
  roster: Map<number, RawAgenciaAtiva>,
  valor: number,
): AgenciaSegmentoResumo {
  const agencia = roster.get(codigo);
  return { nome: agencia?.nome ?? `Agência ${codigo}`, cnpj: agencia?.cnpj ?? "", valor };
}

// `saudeCarteira` original da SPEC cruza venda com "limite de crédito
// comercial" — bloqueado, esse conceito não existe no schema espelhado
// do SICA (só existe `histcred`, que é limite de *pagamento*, não de
// compra; ver docs/mock-exec-resp.md). Em 2026-08-20 os 4 grupos foram
// reinterpretados usando só recência de venda + `empresa_status` do
// roster (mesma fonte de dado de `construirCrossCanalEVendendo30d`, sem
// nenhuma chamada nova ao SST) — mesma estratégia que
// `dashboard-vendas.sst-service.ts` já usa pra `recencia`/
// `cruzamentoCanais` (ver docs/faltante.md), que também nunca teve
// acesso a limite de crédito. Os RÓTULOS (não a lógica de segmentação
// acima) voltaram a mencionar "crédito"/"Carteira Click" por pedido
// explícito do usuário em 2026-08-24 — os `chave`/critério de corte
// continuam os mesmos (recência de venda + status cadastral), só o
// texto exibido mudou; o rótulo não corresponde literalmente ao dado
// real de limite de crédito (que continua indisponível), é só o nome
// que o usuário quer ver na tela.
function construirSaudeCarteira(
  codigosEmpresa: number[],
  rosterPorCodigo: Map<number, RawAgenciaAtiva>,
  aereo365: Map<number, { tarifa: number; qtd: number }>,
  terrestre365: Map<number, { tarifa: number; qtd: number }>,
  vendendo30dSet: Set<number>,
): SegmentoSaude[] {
  const total = codigosEmpresa.length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
  const valor365 = (codigo: number) =>
    (aereo365.get(codigo)?.tarifa ?? 0) + (terrestre365.get(codigo)?.tarifa ?? 0);

  const ativasCodigos = codigosEmpresa.filter((codigo) => vendendo30dSet.has(codigo));
  const potenciaisCodigos = codigosEmpresa.filter(
    (codigo) => !vendendo30dSet.has(codigo) && (aereo365.has(codigo) || terrestre365.has(codigo)),
  );
  const semVenda365Codigos = codigosEmpresa.filter(
    (codigo) => !aereo365.has(codigo) && !terrestre365.has(codigo),
  );
  const ociosasCodigos = semVenda365Codigos.filter(
    (codigo) => rosterPorCodigo.get(codigo)?.empresa_status === "ativo",
  );
  const inativasCodigos = semVenda365Codigos.filter(
    (codigo) => rosterPorCodigo.get(codigo)?.empresa_status !== "ativo",
  );

  const grupo = (
    chave: SegmentoSaude["chave"],
    label: string,
    descricao: string,
    codigos: number[],
    comValor: boolean,
  ): SegmentoSaude => ({
    chave,
    label,
    descricao,
    quantidade: codigos.length,
    pct: pct(codigos.length),
    agencias: codigos.map((codigo) =>
      paraAgenciaSegmento(codigo, rosterPorCodigo, comValor ? valor365(codigo) : 0),
    ),
  });

  return [
    grupo("ativas", "Ativas c/ credito", "Vendeu nos últimos 30 dias", ativasCodigos, true),
    grupo(
      "potenciais",
      "Agencias Carteira Click",
      "Vendeu nos últimos 12 meses, mas não nos últimos 30 dias",
      potenciaisCodigos,
      true,
    ),
    grupo(
      "ociosas",
      "Agencias com Limite de credito parado",
      "Aprovada, sem venda nos últimos 12 meses",
      ociosasCodigos,
      false,
    ),
    grupo(
      "inativas",
      "agencias sem vendas por 60 dias",
      "Status inativo no SICA, sem venda nos últimos 12 meses",
      inativasCodigos,
      false,
    ),
  ];
}

// Linha por agência da aba "Agências" (ver AgenciaCarteiraResumo) — usa os
// mesmos mapas de `construirCrossCanalEVendendo30d` (roster, aereo/
// terrestre 30d e 365d) mais uma janela de 90d nova (só pra essa faixa;
// não usada em mais nada). `faixaRecencia` classifica por ausência do
// código no `Set`/`Map` mais estreito primeiro — quem vendeu nos últimos
// 30d já não é reavaliado contra 90d/365d.
function construirAgenciasCarteira(
  codigosEmpresa: number[],
  rosterPorCodigo: Map<number, RawAgenciaAtiva>,
  aereo365: Map<number, { tarifa: number; qtd: number }>,
  terrestre365: Map<number, { tarifa: number; qtd: number }>,
  aereo90: Map<number, { tarifa: number; qtd: number }>,
  terrestre90: Map<number, { tarifa: number; qtd: number }>,
  aereo30: Map<number, { tarifa: number; qtd: number }>,
  terrestre30: Map<number, { tarifa: number; qtd: number }>,
  vendendo30dSet: Set<number>,
): AgenciaCarteiraResumo[] {
  return codigosEmpresa.map((codigo): AgenciaCarteiraResumo => {
    const agencia = rosterPorCodigo.get(codigo);
    const temAereo = aereo365.has(codigo);
    const temTerrestre = terrestre365.has(codigo);
    const canal: CanalAgenciaCarteira =
      temAereo && temTerrestre
        ? "ambos"
        : temAereo
          ? "aereo"
          : temTerrestre
            ? "terrestre"
            : "nenhum";

    const faixaRecencia: FaixaRecenciaAgencia = vendendo30dSet.has(codigo)
      ? "ate30d"
      : aereo90.has(codigo) || terrestre90.has(codigo)
        ? "30a90d"
        : temAereo || temTerrestre
          ? "90a365d"
          : "semVenda365d";

    return {
      codigo,
      nome: agencia?.nome ?? `Agência ${codigo}`,
      cnpj: agencia?.cnpj ?? "",
      status: agencia?.empresa_status ?? "desconhecido",
      canal,
      faixaRecencia,
      vendasAno: (aereo365.get(codigo)?.tarifa ?? 0) + (terrestre365.get(codigo)?.tarifa ?? 0),
      bilhetesAno: (aereo365.get(codigo)?.qtd ?? 0) + (terrestre365.get(codigo)?.qtd ?? 0),
      vendas90d: (aereo90.get(codigo)?.tarifa ?? 0) + (terrestre90.get(codigo)?.tarifa ?? 0),
      bilhetes90d: (aereo90.get(codigo)?.qtd ?? 0) + (terrestre90.get(codigo)?.qtd ?? 0),
      vendas30d: (aereo30.get(codigo)?.tarifa ?? 0) + (terrestre30.get(codigo)?.tarifa ?? 0),
      bilhetes30d: (aereo30.get(codigo)?.qtd ?? 0) + (terrestre30.get(codigo)?.qtd ?? 0),
    };
  });
}

// `agencias`/`aprovadas`/`vendendo30dPct` usam `roster.length` (SST) como
// denominador, não `Agencia.executivoId` do banco local — decisão do
// usuário (2026-08-20) depois de constatar que `Agencia.executivoId` é
// preenchido manualmente por analista e pode estar vazio pra praticamente
// toda a base num ambiente real (confirmado: 0 de 2 agências no banco de
// teste tinham `executivoId`, mostrando "0 agências" pra todo executivo
// mesmo com carteira real no SST). Diverge de propósito de
// `ExecutivoPerfil.totalAgencias` (ainda local-DB, usado por
// `agencias/`/`agenda/`, ver executivo-detalhe.adapter.ts) — só o
// dashboard, que já paga o custo do roster pra `crossCanal`, usa o número
// do SST.
async function construirCrossCanalEVendendo30d(codigoExecutivo: number): Promise<{
  crossCanal: ExecutivoDashboard["crossCanal"];
  vendendo30d: number;
  vendendo30dPct: number;
  agencias: number;
  saudeCarteira: SegmentoSaude[];
  agenciasCarteira: AgenciaCarteiraResumo[];
}> {
  const hoje = hojeIso();
  const roster = await buscarRoster(codigoExecutivo);
  const rosterPorCodigo = new Map(roster.map((agencia) => [agencia.codigo_empresa, agencia]));

  // `aereo365` primeiro: `/api/agencias/ativas` (roster) confirmou por
  // teste real não ser superset confiável de "agências com venda" — uma
  // agência com venda aérea real ficou de fora do roster (status/cadastro
  // diverge de quem efetivamente vendeu). Por isso os candidatos pra
  // checar atividade terrestre são a união do roster com quem já
  // confirmadamente vendeu aéreo, não só o roster sozinho — senão essa
  // agência nunca seria checada pra terrestre e sairia classificada como
  // "só aéreo" mesmo se também vendesse terrestre.
  const aereo365 = await buscarAereoAgrupado(codigoExecutivo, diasAtrasIso(365), hoje);
  const codigosEmpresa = [...new Set([...roster.map((a) => a.codigo_empresa), ...aereo365.keys()])];

  // Janela de 90d é usada só pra `faixaRecencia` da aba "Agências" (ver
  // construirAgenciasCarteira) — mais um par de chamadas (1 agregada pro
  // aéreo, N pro terrestre) além do 30d/365d que crossCanal já precisava.
  const [terrestre365, aereo30, terrestre30, aereo90, terrestre90] = await Promise.all([
    buscarTerrestrePorAgencia(codigoExecutivo, codigosEmpresa, diasAtrasIso(365), hoje),
    buscarAereoAgrupado(codigoExecutivo, diasAtrasIso(30), hoje),
    buscarTerrestrePorAgencia(codigoExecutivo, codigosEmpresa, diasAtrasIso(30), hoje),
    buscarAereoAgrupado(codigoExecutivo, diasAtrasIso(90), hoje),
    buscarTerrestrePorAgencia(codigoExecutivo, codigosEmpresa, diasAtrasIso(90), hoje),
  ]);

  const vendendo30dSet = new Set([...aereo30.keys(), ...terrestre30.keys()]);
  const vendendo30d = vendendo30dSet.size;

  const soAereoCodigos = [...aereo365.keys()].filter((codigo) => !terrestre365.has(codigo));
  const soTerrestreCodigos = [...terrestre365.keys()].filter((codigo) => !aereo365.has(codigo));
  const ambosCodigos = [...aereo365.keys()].filter((codigo) => terrestre365.has(codigo));
  const ativasUltimos12m = soAereoCodigos.length + soTerrestreCodigos.length + ambosCodigos.length;
  const pct = (n: number) =>
    ativasUltimos12m > 0 ? Math.round((n / ativasUltimos12m) * 1000) / 10 : 0;

  const [air12m, nonAir12m] = await Promise.all([
    buscarAir(diasAtrasIso(365), hoje, codigoExecutivo),
    buscarNonAir(diasAtrasIso(365), hoje, codigoExecutivo),
  ]);

  return {
    vendendo30d,
    vendendo30dPct: roster.length > 0 ? Math.round((vendendo30d / roster.length) * 100) : 0,
    agencias: roster.length,
    saudeCarteira: construirSaudeCarteira(
      codigosEmpresa,
      rosterPorCodigo,
      aereo365,
      terrestre365,
      vendendo30dSet,
    ),
    agenciasCarteira: construirAgenciasCarteira(
      codigosEmpresa,
      rosterPorCodigo,
      aereo365,
      terrestre365,
      aereo90,
      terrestre90,
      aereo30,
      terrestre30,
      vendendo30dSet,
    ),
    crossCanal: {
      ativasUltimos12m,
      aprovadas: roster.length,
      volAereo: air12m.tarifa,
      volTerrestre: nonAir12m.tarifa,
      soAereo: {
        quantidade: soAereoCodigos.length,
        pct: pct(soAereoCodigos.length),
        agencias: soAereoCodigos.map((codigo) =>
          paraAgenciaSegmento(codigo, rosterPorCodigo, aereo365.get(codigo)?.tarifa ?? 0),
        ),
      },
      soTerrestre: {
        quantidade: soTerrestreCodigos.length,
        pct: pct(soTerrestreCodigos.length),
        agencias: soTerrestreCodigos.map((codigo) =>
          paraAgenciaSegmento(codigo, rosterPorCodigo, terrestre365.get(codigo)?.tarifa ?? 0),
        ),
      },
      ambos: {
        quantidade: ambosCodigos.length,
        pct: pct(ambosCodigos.length),
        agencias: ambosCodigos.map((codigo) =>
          paraAgenciaSegmento(
            codigo,
            rosterPorCodigo,
            (aereo365.get(codigo)?.tarifa ?? 0) + (terrestre365.get(codigo)?.tarifa ?? 0),
          ),
        ),
      },
    },
  };
}

// Seção rápida (~6 chamadas, todas agregadas — sem loop por agência) —
// pode renderizar assim que pronta, sem esperar `obterCrossCanalEMiniStats`.
async function obterHeroKpis(
  codigoExecutivo: number,
  promotorId: string,
  totalAgencias: number,
  agencias: ExecutivoAgenciaResumo[],
): Promise<{ hero: ExecutivoDashboard["hero"]; kpis: KpisSecundarios }> {
  const mock = await executivoDashboardMockService.obterDashboard(
    promotorId,
    totalAgencias,
    agencias,
  );
  const resultado = await comFallback("hero+kpis", construirHeroEKpis(codigoExecutivo), {
    hero: mock.hero,
    kpis: mock.kpis,
  });
  return {
    hero: resultado.hero,
    kpis: { ...resultado.kpis, projecaoFimMes: mock.kpis.projecaoFimMes },
  };
}

// Seção pesada (roster + loop de terrestre por agência, ~2N+5 chamadas) —
// fica atrás do próprio Suspense na view, separada de hero+kpis (ver
// comentário no topo do arquivo).
async function obterCrossCanalEMiniStats(
  codigoExecutivo: number,
  promotorId: string,
  totalAgencias: number,
  agencias: ExecutivoAgenciaResumo[],
): Promise<{
  crossCanal: ExecutivoDashboard["crossCanal"];
  miniStats: MiniStats;
  saudeCarteira: SegmentoSaude[];
  agenciasCarteira: AgenciaCarteiraResumo[];
}> {
  const mock = await executivoDashboardMockService.obterDashboard(
    promotorId,
    totalAgencias,
    agencias,
  );
  const resultado = await comFallback(
    "crossCanal+vendendo30d+saudeCarteira+agenciasCarteira",
    construirCrossCanalEVendendo30d(codigoExecutivo),
    {
      crossCanal: mock.crossCanal,
      vendendo30d: mock.miniStats.vendendo30d,
      vendendo30dPct: mock.miniStats.vendendo30dPct,
      // fallback só se a chamada ao roster falhar de vez — usa o número
      // do banco local como último recurso, mesma convenção antiga.
      agencias: totalAgencias,
      saudeCarteira: mock.saudeCarteira,
      // sem equivalente mock pra lista de agências reais — cai vazia em
      // vez de inventar linhas (a aba "Agências" mostra uma mensagem de
      // erro/lista vazia nesse caso, não fabrica dado).
      agenciasCarteira: [],
    },
  );
  return {
    crossCanal: resultado.crossCanal,
    saudeCarteira: resultado.saudeCarteira,
    agenciasCarteira: resultado.agenciasCarteira,
    miniStats: {
      ...mock.miniStats,
      agencias: resultado.agencias,
      vendendo30d: resultado.vendendo30d,
      vendendo30dPct: resultado.vendendo30dPct,
    },
  };
}

export const executivoDashboardSstService = {
  obterHeroKpis,
  obterCrossCanalEMiniStats,
};

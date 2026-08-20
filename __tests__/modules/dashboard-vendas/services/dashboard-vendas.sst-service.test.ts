import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";
import {
  __limparCacheParaTestes,
  dashboardVendasSstService,
} from "@/modules/dashboard-vendas/services/dashboard-vendas.sst-service";

const originalEnv = process.env;

// Shapes confirmados contra o SST real (sst.flysakura.com/docs/json),
// 2026-08-14 — ver conversa que motivou esta integração.
const overviewFixture = {
  filial: {
    total: { dia: { margem: 5 }, mes: { margem: 5.5 }, ano: { margem: 5.8 } },
    aereo: {
      dia: {
        tarifa: 524242.53,
        margem: 4.02,
        clientes: 62,
        tickets: 270,
        ticket_medio: 1941.64,
        nacInter: {
          nacional: { tickets: 190, tarifa: 367_000, percentual: 70 },
          internacional: { tickets: 80, tarifa: 157_242.53, percentual: 30 },
        },
      },
      mes: {
        tarifa: 1e6,
        margem: 4.1,
        clientes: 100,
        tickets: 500,
        ticket_medio: 2000,
        nacInter: {
          nacional: { tickets: 350, tarifa: 700_000, percentual: 70 },
          internacional: { tickets: 150, tarifa: 300_000, percentual: 30 },
        },
      },
      ano: {
        tarifa: 1e7,
        margem: 4.2,
        clientes: 1000,
        tickets: 5000,
        ticket_medio: 2000,
        nacInter: {
          nacional: { tickets: 3500, tarifa: 7e6, percentual: 70 },
          internacional: { tickets: 1500, tarifa: 3e6, percentual: 30 },
        },
      },
    },
    terrestre: {
      dia: {
        tarifa: 17034.52,
        margem: 10.02,
        clientes: 15,
        tickets: 26,
        ticket_medio: 655.17,
        nacInter: {
          nacional: { tickets: 23, tarifa: 15_000, percentual: 88 },
          internacional: { tickets: 3, tarifa: 2_034.52, percentual: 12 },
        },
      },
      mes: {
        tarifa: 5e4,
        margem: 15,
        clientes: 10,
        tickets: 30,
        ticket_medio: 1666,
        nacInter: {
          nacional: { tickets: 27, tarifa: 44_000, percentual: 88 },
          internacional: { tickets: 3, tarifa: 6_000, percentual: 12 },
        },
      },
      ano: {
        tarifa: 5e5,
        margem: 15,
        clientes: 100,
        tickets: 300,
        ticket_medio: 1666,
        nacInter: {
          nacional: { tickets: 264, tarifa: 440_000, percentual: 88 },
          internacional: { tickets: 36, tarifa: 60_000, percentual: 12 },
        },
      },
    },
  },
};

const topAgenciasFixture = {
  data: [
    { nome_fantasia: "TJT VIAGENS", total_bilhetes: 5244, tarifa_total: 5674287.35 },
    { nome_fantasia: "VAI DE PROMO", total_bilhetes: 3909, tarifa_total: 3748413.08 },
  ],
  total: 2120,
};

const rankingCiasFixture = {
  data: [
    { nome_companhia: "LATAM", total_bilhetes: 26177, tarifa_total: 83073026.42 },
    { nome_companhia: "306", total_bilhetes: 13327, tarifa_total: 16111634.17 },
  ],
  total: 5,
};

const nacIntFixture = {
  data: [
    { tipo_rota: "INTER", total_bilhetes: 10494, tarifa_total: 61461942.49 },
    { tipo_rota: "NAC", total_bilhetes: 29095, tarifa_total: 37855851.43 },
  ],
  total: 2,
};

// Mesma conta de data que `diasAtrasIso`/`formatarDataIsoBrasilia` fazem
// no service (fuso America/Sao_Paulo, formato YYYY-MM-DD) — usado pra
// montar fixtures por data pro teste de projeção (precisa de totais
// distintos nas 4 semanas pra exercitar o descarte do menor de verdade).
function dataIsoBrasiliaHaDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

// Mesma conta de `inicioMesIso()` do service — primeiro dia do mês
// corrente, no fuso America/Sao_Paulo.
function inicioMesIsoTeste(): string {
  return `${dataIsoBrasiliaHaDias(0).slice(0, 7)}-01`;
}

// Datas usadas pelo algoritmo de projeção: mesmo dia da semana, últimas
// 4 ocorrências (7/14/21/28 dias atrás) + hoje. Total de 14 dias atrás é
// o menor (130_000) — deve ser descartado, sobrando 150_000/165_000/140_000
// (média 151_666,67; desvio padrão amostral ~12_583,06).
const nacIntPorDataFixture: Record<string, { data: Array<Record<string, unknown>> }> = {
  [dataIsoBrasiliaHaDias(7)]: {
    data: [
      { tipo_rota: "NAC", total_bilhetes: 100, tarifa_total: 100_000 },
      { tipo_rota: "INTER", total_bilhetes: 20, tarifa_total: 50_000 },
    ],
  },
  [dataIsoBrasiliaHaDias(14)]: {
    data: [
      { tipo_rota: "NAC", total_bilhetes: 90, tarifa_total: 90_000 },
      { tipo_rota: "INTER", total_bilhetes: 18, tarifa_total: 40_000 },
    ],
  },
  [dataIsoBrasiliaHaDias(21)]: {
    data: [
      { tipo_rota: "NAC", total_bilhetes: 110, tarifa_total: 110_000 },
      { tipo_rota: "INTER", total_bilhetes: 22, tarifa_total: 55_000 },
    ],
  },
  [dataIsoBrasiliaHaDias(28)]: {
    data: [
      { tipo_rota: "NAC", total_bilhetes: 95, tarifa_total: 95_000 },
      { tipo_rota: "INTER", total_bilhetes: 19, tarifa_total: 45_000 },
    ],
  },
  [dataIsoBrasiliaHaDias(0)]: {
    data: [
      { tipo_rota: "NAC", total_bilhetes: 50, tarifa_total: 60_000 },
      { tipo_rota: "INTER", total_bilhetes: 10, tarifa_total: 20_000 },
    ],
  },
};

// GET /api/resumos/aereo — mesmo conjunto de registros (por hora) pra
// qualquer uma das 3 datas mantidas, já que `respostaPara` não
// discrimina por data aqui (só interessa a FORMA horária, não o valor
// absoluto). 3 registros em horas distintas — suficiente pra provar que
// o bucket por hora e a curva cumulativa funcionam.
const resumosAereoFixture = {
  data: [
    { tarifa: 1_000, created_at: "2026-08-10T12:00:00.000Z" }, // 09h Brasília
    { tarifa: 2_000, created_at: "2026-08-10T15:00:00.000Z" }, // 12h Brasília
    { tarifa: 1_000, created_at: "2026-08-10T21:00:00.000Z" }, // 18h Brasília
  ],
  total: 3,
};

// /api/consolidado/air e /api/consolidado/non-air — mesmo valor pra
// qualquer intervalo de data neste fixture (o teste não varia por data,
// só verifica que o service usa esses campos corretamente).
const airFixture = { tarifa: 1_000_000, clientes: 500, tickets: 2_000, ticket_medio: 500 };
const nonAirFixture = { tarifa: 50_000, clientes: 80, tickets: 300, ticket_medio: 166.67 };

const saudeBasesFixture = {
  data: [{ agencias_ativas: 100 }, { agencias_ativas: 200 }],
  total: 2,
};

// Datas relativas a "agora" (não fixas) — o teste roda em qualquer dia,
// então a classificação em buckets de recência precisa ser calculada a
// partir do momento em que o teste de fato executa.
function isoHaDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return `${data.toISOString().slice(0, 10)}T03:00:00.000Z`;
}

// GET /api/consolidado/air/resumo-agrupado — array plano (sem wrapper),
// um item por agência. Cenário: agência 1 só aéreo (5d atrás, entra em
// "compraram30d"); agência 2 aéreo (100d atrás) + terrestre (40d atrás,
// ver abaixo) → canal "ambos", última venda = 40d (a mais recente) →
// cai em "31-89 sem vender". Reaproveitado também como resposta pro ano
// anterior (mesma fixture, sem discriminar por data) — dá churn=0 no
// teste, o que é uma simplificação aceitável aqui.
const resumoAgrupadoAereoFixture = [
  {
    codigo: 1,
    nome: "AGENCIA UM",
    tarifa: 100_000,
    quantidade_bilhetes: 50,
    data_ultima_venda: isoHaDias(5),
  },
  {
    codigo: 2,
    nome: "AGENCIA DOIS",
    tarifa: 200_000,
    quantidade_bilhetes: 80,
    data_ultima_venda: isoHaDias(100),
  },
];

// GET /api/resumos/terrestre — paginado. Agência 2 (também aparece no
// aéreo, vira "ambos") vendeu terrestre 40d atrás; agência 3 (só
// terrestre) vendeu 10d atrás → entra em "compraram30d", canal
// "terrestre". União de códigos aéreo {1,2} ∪ terrestre {2,3} = {1,2,3}.
const resumosTerrestreFixture = {
  data: [
    { codigo_cliente: 2, cliente: "AGENCIA DOIS", tarifa_cliente: 5_000, data: isoHaDias(40) },
    { codigo_cliente: 3, cliente: "AGENCIA TRES", tarifa_cliente: 3_000, data: isoHaDias(10) },
  ],
  total: 2,
  page: 1,
  limit: 500,
  offset: 0,
};

// GET /api/agencias/top é reaproveitado pra dois usos (ranking mês/ano,
// já coberto por `topAgenciasFixture`; e identidade base/executivo pra
// recência/cruzamento, com `limit=10000`) — precisa distinguir pela URL.
const identidadeAereaFixture = {
  data: [
    { codigo_empresa: 1, codigo_base: "SAO", nome_executivo: "EXEC UM" },
    { codigo_empresa: 2, codigo_base: "BHZ", nome_executivo: "EXEC DOIS" },
  ],
  total: 2,
  page: 1,
  limit: 10_000,
  offset: 0,
};

function respostaPara(url: string) {
  if (url.includes("/api/consolidado/air/resumo-agrupado")) return resumoAgrupadoAereoFixture;
  if (url.includes("/api/resumos/terrestre")) return resumosTerrestreFixture;
  if (url.includes("/api/consolidado/overview")) return overviewFixture;
  if (url.includes("/api/agencias/top")) {
    return url.includes("limit=10000") ? identidadeAereaFixture : topAgenciasFixture;
  }
  if (url.includes("/api/reports/ranking-cias")) return rankingCiasFixture;
  if (url.includes("/api/reports/saude-bases")) return saudeBasesFixture;
  if (url.includes("/api/resumos/aereo")) return resumosAereoFixture;
  if (url.includes("/api/consolidado/nacional-vs-internacional")) {
    const startDate = new URL(url).searchParams.get("startDate");
    if (startDate && startDate in nacIntPorDataFixture) return nacIntPorDataFixture[startDate];
    return nacIntFixture;
  }
  if (url.includes("/api/consolidado/non-air")) return nonAirFixture;
  if (url.includes("/api/consolidado/air")) return airFixture;
  throw new Error(`URL não mapeada na fixture do teste: ${url}`);
}

describe("dashboardVendasSstService", () => {
  beforeEach(() => {
    __limparCacheParaTestes();
    process.env = {
      ...originalEnv,
      SST_API_KEY: "secret-teste",
      SST_BASE_URL: "https://sst.teste",
      // Explicitamente desligado: sem isto, quem tiver VALKEY_URL
      // configurada no .env local (pro Valkey real do docker-compose)
      // faria estes testes baterem no Valkey de verdade via `...originalEnv`
      // acima — cache persistindo entre testes/execuções e quebrando as
      // asserções de contagem de chamada ao `fetch` abaixo.
      VALKEY_URL: undefined,
    };
    global.fetch = jest.fn(async (url: RequestInfo | URL) => ({
      ok: true,
      status: 200,
      json: async () => respostaPara(String(url)),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta resumoPorPeriodo e miniKpis a partir do overview real", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.resumoPorPeriodo.hoje.aereo).toMatchObject({
      valor: 524242.53,
      quantidade: 270,
      margemPct: 4.02,
    });
    expect(resultado.resumoPorPeriodo.mes.aereo.valor).toBe(1e6);
    expect(resultado.resumoPorPeriodo.ano.terrestre.valor).toBe(5e5);
    expect(resultado.miniKpis).toEqual({
      hoje: { clientesDistintos: 62, bilhetesAereo: 270, ticketMedioAereo: 1941.64 },
      ontem: { clientesDistintos: 62, bilhetesAereo: 270, ticketMedioAereo: 1941.64 },
      mes: { clientesDistintos: 100, bilhetesAereo: 500, ticketMedioAereo: 2000 },
      ano: { clientesDistintos: 1000, bilhetesAereo: 5000, ticketMedioAereo: 2000 },
    });
  });

  it("normaliza o ranking de agências (sem canal separado no SST — assume aereo)", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.rankingPorPeriodo.mes).toEqual([
      { posicao: 1, nome: "TJT VIAGENS", canal: "aereo", valor: 5674287.35, qtd: 5244 },
      { posicao: 2, nome: "VAI DE PROMO", canal: "aereo", valor: 3748413.08, qtd: 3909 },
    ]);
  });

  it("calcula participacaoPct do ranking de fornecedores a partir da própria página retornada", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();
    const total = 83073026.42 + 16111634.17;

    expect(resultado.fornecedoresPorPeriodo.mes).toEqual([
      {
        nome: "LATAM",
        qtdBilhetes: 26177,
        valor: 83073026.42,
        participacaoPct: (83073026.42 / total) * 100,
      },
      {
        nome: "306",
        qtdBilhetes: 13327,
        valor: 16111634.17,
        participacaoPct: (16111634.17 / total) * 100,
      },
    ]);
  });

  it("reagrupa o array nacional/internacional do SST no shape esperado pela view", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.nacionalInternacionalPorMes.mes).toEqual({
      nacional: { valor: 37855851.43, bilhetes: 29095 },
      internacional: { valor: 61461942.49, bilhetes: 10494 },
    });
  });

  it("monta vendasDiarias com 30 dias, um por dia, usando /consolidado/air e /consolidado/non-air", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.vendasDiarias).toHaveLength(30);
    expect(resultado.vendasDiarias[0]).toEqual({
      data: expect.stringMatching(/^\d{2}\/\d{2}$/),
      aereo: airFixture.tarifa,
      terrestre: nonAirFixture.tarifa,
    });
  });

  it("monta vendasMensais desde janeiro até o mês corrente, usando nacional-vs-internacional + non-air", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.vendasMensais.length).toBeGreaterThan(0);
    expect(resultado.vendasMensais[0]).toEqual({
      mes: expect.stringMatching(/^[A-Z][a-z]{2}\/\d{2}$/),
      aereoNacional: 37855851.43,
      aereoInternacional: 61461942.49,
      terrestre: nonAirFixture.tarifa,
    });
  });

  it("monta conversao real pra aereo/terrestre/ambos, incluindo a união de agências ativas", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();
    const totalAtivas = 300;

    expect(resultado.conversao.aereo).toMatchObject({
      saudePct: (airFixture.clientes / totalAtivas) * 100,
      volumeMesVarPct: 0,
      bilhetesVendasMesVarPct: 0,
      agenciasMesVarPct: 0,
      aereoMes: { valor: airFixture.tarifa, bilhetes: airFixture.tickets },
      terrestreMes: { valor: nonAirFixture.tarifa, vendas: nonAirFixture.tickets },
    });
    expect(resultado.conversao.terrestre.saudePct).toBeCloseTo(
      (nonAirFixture.clientes / totalAtivas) * 100,
    );
    // União {1,2} (aéreo) ∪ {2,3} (terrestre) = {1,2,3} → 3 agências.
    expect(resultado.conversao.ambos.saudePct).toBeCloseTo((3 / totalAtivas) * 100);
    expect(resultado.conversao.ambos.agenciasMesVarPct).toBe(0);
    expect(resultado.conversao.ambos.volumeMesVarPct).toBe(0);
  });

  it("classifica recencia usando a união aéreo(365d)/terrestre(90d) por agência", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    // Agência 1 (só aéreo, 5d atrás) e agência 3 (só terrestre, 10d atrás)
    // caem em compraram30d; agência 2 (ambos, última venda 40d atrás) fica
    // de fora desse grupo.
    expect(resultado.recencia.compraram30d).toEqual({
      total: 2,
      soAereo: 1,
      soTerrestre: 1,
      ambos: 0,
    });
    // Agência 2 (ambos, 40d atrás) cai na faixa 31-89.
    expect(resultado.recencia.semVendas30dMais).toMatchObject({
      total: 1,
      faixa31a89: 1,
      faixa90a179: 0,
      faixa180Mais: 0,
    });

    const detalheCompraram30d = resultado.recenciaDetalhe.compraram30d;
    expect(detalheCompraram30d).toHaveLength(2);
    expect(detalheCompraram30d.map((item) => item.canal).sort()).toEqual(["aereo", "terrestre"]);
    expect(detalheCompraram30d.find((item) => item.nome === "AGENCIA UM")).toMatchObject({
      filial: "SAO",
      executivo: "EXEC UM",
      aereo365d: 100_000,
    });
  });

  it("monta cruzamentoCanais como união de agências (aéreo, terrestre, ambos) sobre o total de ativas", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    // ambos: agência 2 (aéreo + terrestre); soAereo: agência 1; soTerrestre:
    // agência 3; total de carteira = 300 (soma do saude-bases fixture).
    expect(resultado.cruzamentoCanais).toMatchObject({
      totalAgenciasCarteira: 300,
      ambos: { qtd: 1 },
      soAereo: { qtd: 1 },
      soTerrestre: { qtd: 1 },
      nenhum: { qtd: 297 },
    });
    expect(resultado.cruzamentoDetalhe.ambos[0]).toMatchObject({
      nome: "AGENCIA DOIS",
      base: "BHZ",
    });
    // Sem identidade conhecida pra quem não vendeu nada nas janelas usadas
    // — lista de detalhe fica vazia, só a contagem é real (ver
    // docs/faltante.md).
    expect(resultado.cruzamentoDetalhe.nenhum).toEqual([]);
  });

  it("deriva codigosAgenciasAereo/Terrestre de janelas que terminam hoje (30d/mês corrente) a partir do que recenciaECruzamento já buscou, sem paginar terrestre de novo (ver docs/optimize.md)", async () => {
    // Roda na mesma ordem sequencial da view real (dashboard-vendas-view.tsx):
    // recenciaECruzamento antes de conversao — só assim a janela fica em
    // cache pra conversao aproveitar.
    await dashboardVendasSstService.obterRecenciaECruzamento();

    const fetchMock = global.fetch as jest.Mock;
    const chamadasAntes = fetchMock.mock.calls.length;

    const conversao = await dashboardVendasSstService.obterConversao();

    const chamadasDepois = fetchMock.mock.calls.slice(chamadasAntes);
    const chamadasTerrestre = chamadasDepois.filter(([url]) =>
      String(url).includes("/api/resumos/terrestre"),
    );
    const chamadasAereoResumoAgrupado = chamadasDepois.filter(([url]) =>
      String(url).includes("/api/consolidado/air/resumo-agrupado"),
    );

    // 3 janelas em conversao (30d, mês corrente, mês anterior) — só a de
    // "mês anterior" não termina hoje, então só ela precisa buscar de novo.
    expect(chamadasTerrestre).toHaveLength(1);
    expect(chamadasAereoResumoAgrupado).toHaveLength(1);

    // Ambos(30d) derivado da janela: aereo {1} (cod.1, 5d atrás) ∪
    // terrestre {3} (cod.3, 10d atrás) = {1,3} — cod.2 fica de fora (aereo
    // 100d atrás, terrestre 40d atrás, os dois fora dos últimos 30d).
    expect(conversao.ambos.saudePct).toBeCloseTo((2 / 300) * 100);
  });

  it("reaproveita nacint/nonair do mês corrente entre estágios sequenciais — guardrail contra paralelizar o waterfall (ver docs/optimize.md)", async () => {
    const inicioMes = inicioMesIsoTeste();
    const hoje = dataIsoBrasiliaHaDias(0);

    // Mesma ordem da view real: resumoEDia → conversao → vendasMensais.
    await dashboardVendasSstService.obterResumoEDia();
    await dashboardVendasSstService.obterConversao();
    await dashboardVendasSstService.obterVendasMensais();

    const fetchMock = global.fetch as jest.Mock;
    const contarChamadas = (caminho: string) =>
      fetchMock.mock.calls.filter(([url]) => {
        const str = String(url);
        if (!str.includes(caminho)) return false;
        const parsed = new URL(str);
        return (
          parsed.searchParams.get("startDate") === inicioMes &&
          parsed.searchParams.get("endDate") === hoje
        );
      }).length;

    // Se isto passar a dar 2, o waterfall deixou de ser sequencial e o
    // reaproveitamento via comCache (que hoje é "de graça") parou de
    // funcionar — ver ponto 2 de docs/optimize.md.
    expect(contarChamadas("/api/consolidado/nacional-vs-internacional")).toBe(1);
    expect(contarChamadas("/api/consolidado/non-air")).toBe(1);
  });

  it("reaproveita /api/reports/saude-bases entre recenciaECruzamento e conversao — não bate 2x no SST pro mesmo total (ver docs/optimize.md, ponto 1)", async () => {
    // Mesma ordem da view real: recenciaECruzamento → conversao.
    await dashboardVendasSstService.obterRecenciaECruzamento();
    await dashboardVendasSstService.obterConversao();

    const fetchMock = global.fetch as jest.Mock;
    const chamadasSaudeBases = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes("/api/reports/saude-bases"),
    );

    // `totalAgenciasAtivas()` é usada por construirConversao (`ativas`) e
    // por construirCruzamento (`totalCarteira`) — mesmo dado, mesmo
    // request. Sem `comCache` nela, batia 2x no SST à toa.
    expect(chamadasSaudeBases).toHaveLength(1);
  });

  it("mantém intraday/acuracia vindos do mock (fora de escopo — ver docs/faltante.md)", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.intraday.length).toBeGreaterThan(0);
    expect(resultado.acuracia).toBeDefined();
  });

  it("calcula projecao real com o histórico do mesmo dia da semana (descarta o menor, média dos 3 restantes)", async () => {
    const projecao = await dashboardVendasSstService.obterProjecao();

    const media = 151_666.666_666_666_66;
    const desvio = 12_583.057_392_117_92;
    expect(projecao.fechamentoEsperado).toBeCloseTo(media);
    expect(projecao.faixaMin).toBeCloseTo(media - desvio);
    expect(projecao.faixaMax).toBeCloseTo(media + desvio);
    expect(projecao.nacional.projecao).toBeCloseTo((100_000 + 110_000 + 95_000) / 3);
    expect(projecao.internacional.projecao).toBeCloseTo((50_000 + 55_000 + 45_000) / 3);
  });

  it("usa buscarNacInt(hoje, hoje) pra realizado/aEmitir, nunca negativo", async () => {
    const projecao = await dashboardVendasSstService.obterProjecao();

    expect(projecao.realizado).toBe(80_000);
    expect(projecao.nacional.realizado).toBe(60_000);
    expect(projecao.internacional.realizado).toBe(20_000);
    expect(projecao.aEmitir).toBeCloseTo(151_666.666_666_666_66 - 80_000);
  });

  it("aEmitir fica em 0 quando o realizado de hoje já ultrapassa a projeção", async () => {
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/consolidado/nacional-vs-internacional")) {
        const startDate = new URL(urlStr).searchParams.get("startDate");
        if (startDate === dataIsoBrasiliaHaDias(0)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [
                { tipo_rota: "NAC", total_bilhetes: 5000, tarifa_total: 9_000_000 },
                { tipo_rota: "INTER", total_bilhetes: 1000, tarifa_total: 1_000_000 },
              ],
            }),
          };
        }
      }
      return { ok: true, status: 200, json: async () => respostaPara(urlStr) };
    }) as unknown as typeof fetch;

    const projecao = await dashboardVendasSstService.obterProjecao();
    expect(projecao.realizado).toBe(10_000_000);
    expect(projecao.aEmitir).toBe(0);
  });

  it("monta a curva horária real a partir da forma dos 3 dias mantidos (sem split nacional/internacional)", async () => {
    const projecao = await dashboardVendasSstService.obterProjecao();

    expect(projecao.curva).toHaveLength(24);
    expect(projecao.curva[0]!.hora).toBe("00:00");
    expect(projecao.curva[23]!.hora).toBe("23:00");
    // Fixture tem vendas só nas horas 9/12/18 — a curva esperada cresce
    // nessas horas e fecha exatamente no fechamentoEsperado na última.
    expect(projecao.curva[23]!.esperado).toBeCloseTo(projecao.fechamentoEsperado);
    expect(projecao.curva[8]!.esperado).toBe(0);
    expect(projecao.curva[9]!.esperado).toBeGreaterThan(0);
  });

  it("degrada só projecao pro mock quando o SST falha nessas chamadas, sem afetar vendasMensais", async () => {
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/consolidado/nacional-vs-internacional")) {
        const startDate = new URL(urlStr).searchParams.get("startDate");
        if (startDate && startDate in nacIntPorDataFixture) {
          return { ok: false, status: 500, text: async () => '{"message":"erro simulado"}' };
        }
      }
      return { ok: true, status: 200, json: async () => respostaPara(urlStr) };
    }) as unknown as typeof fetch;

    const [projecao, mockEstatico, vendasMensais] = await Promise.all([
      dashboardVendasSstService.obterProjecao(),
      dashboardVendasMockService.obterProjecao(),
      dashboardVendasSstService.obterVendasMensais(),
    ]);

    expect(projecao).toEqual(mockEstatico);
    expect(vendasMensais.length).toBeGreaterThan(0);
  });

  it("degrada só recencia/cruzamentoCanais pro mock quando o SST devolve 500 persistente, sem derrubar o resto da página", async () => {
    global.fetch = jest.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("/api/resumos/terrestre")) {
        return {
          ok: false,
          status: 500,
          text: async () => '{"message":"[sigot] rawQuery failed"}',
        };
      }
      return { ok: true, status: 200, json: async () => respostaPara(String(url)) };
    }) as unknown as typeof fetch;

    // Não deve rejeitar mesmo com o SST falhando persistentemente numa
    // das chamadas — é exatamente o bug relatado (página inteira quebrava).
    const resultado = await dashboardVendasSstService.obterDashboard();

    // Seções que dependem da paginação de terrestre voltam pro mock...
    expect(resultado.recencia).toBeDefined();
    expect(resultado.cruzamentoCanais.totalAgenciasCarteira).not.toBe(300);
    // ...mas o resto do dashboard (que não depende disso) continua real.
    expect(resultado.miniKpis).toEqual({
      hoje: { clientesDistintos: 62, bilhetesAereo: 270, ticketMedioAereo: 1941.64 },
      ontem: { clientesDistintos: 62, bilhetesAereo: 270, ticketMedioAereo: 1941.64 },
      mes: { clientesDistintos: 100, bilhetesAereo: 500, ticketMedioAereo: 2000 },
      ano: { clientesDistintos: 1000, bilhetesAereo: 5000, ticketMedioAereo: 2000 },
    });
  });
});

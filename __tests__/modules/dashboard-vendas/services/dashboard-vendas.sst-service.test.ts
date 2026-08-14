import {
  __limparCacheParaTestes,
  dashboardVendasSstService,
} from "@/modules/dashboard-vendas/services/dashboard-vendas.sst-service";
import { dashboardVendasMockService } from "@/modules/dashboard-vendas/services/dashboard-vendas.mock-service";

const originalEnv = process.env;

// Shapes confirmados contra o SST real (sst.flysakura.com/docs/json),
// 2026-08-14 — ver conversa que motivou esta integração.
const overviewFixture = {
  filial: {
    total: { dia: {}, mes: {}, ano: {} },
    aereo: {
      dia: { tarifa: 524242.53, margem: 4.02, clientes: 62, tickets: 270, ticket_medio: 1941.64 },
      mes: { tarifa: 1e6, margem: 4.1, clientes: 100, tickets: 500, ticket_medio: 2000 },
      ano: { tarifa: 1e7, margem: 4.2, clientes: 1000, tickets: 5000, ticket_medio: 2000 },
    },
    terrestre: {
      dia: { tarifa: 17034.52, margem: 10.02, clientes: 15, tickets: 26, ticket_medio: 655.17 },
      mes: { tarifa: 5e4, margem: 15, clientes: 10, tickets: 30, ticket_medio: 1666 },
      ano: { tarifa: 5e5, margem: 15, clientes: 100, tickets: 300, ticket_medio: 1666 },
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

// /api/consolidado/air e /api/consolidado/non-air — mesmo valor pra
// qualquer intervalo de data neste fixture (o teste não varia por data,
// só verifica que o service usa esses campos corretamente).
const airFixture = { tarifa: 1_000_000, clientes: 500, tickets: 2_000, ticket_medio: 500 };
const nonAirFixture = { tarifa: 50_000, clientes: 80, tickets: 300, ticket_medio: 166.67 };

const saudeBasesFixture = {
  data: [{ agencias_ativas: 100 }, { agencias_ativas: 200 }],
  total: 2,
};

function respostaPara(url: string) {
  if (url.includes("/api/consolidado/overview")) return overviewFixture;
  if (url.includes("/api/agencias/top")) return topAgenciasFixture;
  if (url.includes("/api/reports/ranking-cias")) return rankingCiasFixture;
  if (url.includes("/api/reports/saude-bases")) return saudeBasesFixture;
  if (url.includes("/api/consolidado/nacional-vs-internacional")) return nacIntFixture;
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
      clientesDistintos: 62,
      bilhetesAereo: 270,
      ticketMedioAereo: 1941.64,
    });
  });

  it("normaliza o ranking de agências (sem canal separado no SST — assume aereo)", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.rankingPorMes.mes).toEqual([
      { posicao: 1, nome: "TJT VIAGENS", canal: "aereo", valor: 5674287.35, qtd: 5244 },
      { posicao: 2, nome: "VAI DE PROMO", canal: "aereo", valor: 3748413.08, qtd: 3909 },
    ]);
  });

  it("calcula participacaoPct do ranking de fornecedores a partir da própria página retornada", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();
    const total = 83073026.42 + 16111634.17;

    expect(resultado.fornecedoresPorMes.mes).toEqual([
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

  it("monta conversao real pra aereo/terrestre e mantém ambos.saudePct/agenciasMesVarPct do mock", async () => {
    const [resultado, mock] = await Promise.all([
      dashboardVendasSstService.obterDashboard(),
      dashboardVendasMockService.obterDashboard(),
    ]);
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
    expect(resultado.conversao.ambos.saudePct).toBe(mock.conversao.ambos.saudePct);
    expect(resultado.conversao.ambos.agenciasMesVarPct).toBe(
      mock.conversao.ambos.agenciasMesVarPct,
    );
    expect(resultado.conversao.ambos.volumeMesVarPct).toBe(0);
  });

  it("mantém as seções ainda sem fonte real vindas do mock (ex.: projeção)", async () => {
    const resultado = await dashboardVendasSstService.obterDashboard();

    expect(resultado.projecao).toBeDefined();
    expect(resultado.intraday.length).toBeGreaterThan(0);
  });
});

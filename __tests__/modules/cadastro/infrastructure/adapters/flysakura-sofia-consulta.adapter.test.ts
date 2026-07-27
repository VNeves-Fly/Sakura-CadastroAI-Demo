import { FlysakuraSofiaConsultaAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-sofia-consulta.adapter";

const originalEnv = process.env;

describe("FlysakuraSofiaConsultaAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AGENCY_ANALYSIS_API_KEY: "secret-teste",
      AGENCY_ANALYSIS_BASE_URL: "https://agente.teste",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta a URL certa e devolve total/records quando o CNPJ não consta", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ total: 0, records: [] }),
    });

    const resultado = await new FlysakuraSofiaConsultaAdapter().consultarPorCnpj("13586269000143");

    expect(resultado).toEqual({ total: 0, records: [] });

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toBe(
      "https://agente.teste/api/v1/sofia/?field=CNPJ&value=13586269000143&formatter=cnpj",
    );
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
  });

  it("devolve os records quando o CNPJ consta", async () => {
    const registro = {
      id: 3343,
      razaoSocial: "SCHEIBE VIAGENS E TURISMO LTDA",
      cidade: "Porto Alegre",
      uf: "RS",
      situacao: "Indefinido",
      status: 1,
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ total: 1, records: [registro] }),
    });

    const resultado = await new FlysakuraSofiaConsultaAdapter().consultarPorCnpj("13586269000143");

    expect(resultado).toEqual({ total: 1, records: [registro] });
  });

  it("lança erro claro quando a resposta não é 2xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "erro interno",
    });

    await expect(
      new FlysakuraSofiaConsultaAdapter().consultarPorCnpj("13586269000143"),
    ).rejects.toThrow("sofia respondeu 500");
  });

  it("lança erro claro se AGENCY_ANALYSIS_API_KEY não está configurada", async () => {
    delete process.env.AGENCY_ANALYSIS_API_KEY;

    await expect(
      new FlysakuraSofiaConsultaAdapter().consultarPorCnpj("13586269000143"),
    ).rejects.toThrow("AGENCY_ANALYSIS_API_KEY não configurada");
  });
});

import { FlysakuraSstAdapter } from "@/modules/cadastro/infrastructure/adapters/flysakura-sst.adapter";

const originalEnv = process.env;

describe("FlysakuraSstAdapter", () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SST_API_KEY: "secret-teste",
      SST_BASE_URL: "https://sst.teste",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("monta a URL certa (cnpj) e mapeia o registro encontrado", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            codigo_empresa: 57295,
            nome: "017 VIAGENS",
            cnpj: "43600690000122",
            telefone: "17996364199",
            email: "FINANCEIRO@017VIAGENS.COM.BR",
            empresa_status: "ativo",
            codigo_executivo: 42,
            nome_executivo: "INATIVO",
          },
        ],
        total: 1,
        page: 1,
        offset: 0,
      }),
    });

    const resultado = await new FlysakuraSstAdapter().consultarSicaCNPJ("43600690000122");

    expect(resultado).toEqual({
      encontrado: true,
      registro: {
        codigoEmpresa: 57295,
        nome: "017 VIAGENS",
        cnpj: "43600690000122",
        telefone: "17996364199",
        email: "FINANCEIRO@017VIAGENS.COM.BR",
        empresaStatus: "ativo",
        codigoExecutivo: 42,
        nomeExecutivo: "INATIVO",
      },
    });

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toBe(
      "https://sst.teste/api/agencias/ativas?cnpj=43600690000122&realtime=true",
    );
    expect(opts.headers["X-Internal-Secret"]).toBe("secret-teste");
  });

  it("monta a URL certa (codigoEmpresa) — mesmo endpoint, parâmetro diferente", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, page: 1, offset: 0 }),
    });

    await new FlysakuraSstAdapter().consultarSicaCodigoEmpresa(57295);

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toBe(
      "https://sst.teste/api/agencias/ativas?codigoEmpresa=57295&realtime=true",
    );
  });

  it("devolve encontrado=false quando data vem vazio", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, page: 1, offset: 0 }),
    });

    const resultado = await new FlysakuraSstAdapter().consultarSicaCNPJ("00000000000000");

    expect(resultado).toEqual({ encontrado: false, registro: null });
  });

  it("lança erro claro quando a resposta não é 2xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "erro interno",
    });

    await expect(new FlysakuraSstAdapter().consultarSicaCNPJ("43600690000122")).rejects.toThrow(
      "SST respondeu 500",
    );
  });

  it("lança erro claro se SST_API_KEY não está configurada", async () => {
    delete process.env.SST_API_KEY;

    await expect(new FlysakuraSstAdapter().consultarSicaCNPJ("43600690000122")).rejects.toThrow(
      "SST_API_KEY não configurada",
    );
  });
});

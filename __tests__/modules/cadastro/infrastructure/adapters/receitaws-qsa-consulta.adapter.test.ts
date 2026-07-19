import { ReceitaWsQsaConsultaAdapter } from "@/modules/cadastro/infrastructure/adapters/receitaws-qsa-consulta.adapter";

const originalEnv = process.env;

function mockFetchResolvedOnce(response: {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
}) {
  (global.fetch as jest.Mock).mockResolvedValueOnce(response);
}

describe("ReceitaWsQsaConsultaAdapter", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, RECEITAWS_API_TOKEN: "token-teste" };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("mapeia uma consulta bem-sucedida pro formato QsaResult, usando days=30 por padrão", async () => {
    mockFetchResolvedOnce({
      status: 200,
      ok: true,
      json: async () => ({
        status: "OK",
        cnpj: "19131243000197",
        nome: "OPEN KNOWLEDGE BRASIL",
        atividade_principal: [
          { code: "94.30-8-00", text: "Atividades de associações de defesa de direitos sociais" },
        ],
        qsa: [{ nome: "HAYDEE SVAB", qual: "16-Presidente" }],
        abertura: "03/10/2013",
        telefone: "(11) 2385-1939",
        email: "torres.contab@gmail.com",
      }),
    });

    const resultado = await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://receitaws.com.br/v1/cnpj/19131243000197/days/30?fallback=cacheOnError",
      { headers: { Authorization: "Bearer token-teste" } },
    );
    expect(resultado).toEqual({
      cnpj: "19131243000197",
      razaoSocial: "OPEN KNOWLEDGE BRASIL",
      cnaeCompativel: false,
      socios: [{ nome: "HAYDEE SVAB" }],
      dataAbertura: "03/10/2013",
      telefoneReceita: "(11) 2385-1939",
      emailReceita: "torres.contab@gmail.com",
    });
  });

  it("respeita RECEITAWS_MAX_DAYS quando configurada", async () => {
    process.env.RECEITAWS_MAX_DAYS = "7";
    mockFetchResolvedOnce({
      status: 200,
      ok: true,
      json: async () => ({ status: "ERROR", message: "x" }),
    });

    await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://receitaws.com.br/v1/cnpj/19131243000197/days/7?fallback=cacheOnError",
      expect.anything(),
    );
  });

  it("reconhece CNAE de agência de viagem (divisão 79) como compatível", async () => {
    mockFetchResolvedOnce({
      status: 200,
      ok: true,
      json: async () => ({
        status: "OK",
        nome: "Agência de Viagens Exemplo",
        atividade_principal: [{ code: "79.11-2-00", text: "Agências de viagens" }],
        qsa: [],
        abertura: "01/01/2020",
        telefone: "",
        email: "",
      }),
    });

    const resultado = await new ReceitaWsQsaConsultaAdapter().consultar("11222333000181");

    expect(resultado?.cnaeCompativel).toBe(true);
  });

  it("retorna null pra CNPJ inválido — mesmo quando o HTTP é 400 (a spec oficial documenta 200, mas o comportamento real é 400)", async () => {
    mockFetchResolvedOnce({
      status: 400,
      ok: false,
      json: async () => ({ status: "ERROR", message: "CNPJ inválido" }),
    });

    const resultado = await new ReceitaWsQsaConsultaAdapter().consultar("00000000000000");

    expect(resultado).toBeNull();
  });

  it("retorna null quando o limite de consultas foi excedido (402)", async () => {
    mockFetchResolvedOnce({ status: 402, ok: false, json: async () => null });

    expect(await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197")).toBeNull();
  });

  it("retorna null em timeout da consulta em tempo real (504)", async () => {
    mockFetchResolvedOnce({ status: 504, ok: false, json: async () => null });

    expect(await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197")).toBeNull();
  });

  it("lança erro se o corpo da resposta não é um JSON válido", async () => {
    mockFetchResolvedOnce({
      status: 500,
      ok: false,
      json: () => Promise.reject(new Error("invalid json")),
    });

    await expect(new ReceitaWsQsaConsultaAdapter().consultar("19131243000197")).rejects.toThrow(
      "ReceitaWS respondeu 500 sem corpo JSON válido.",
    );
  });

  it("lança erro se a resposta não é ok e o corpo não é um erro reconhecido (ex: token inválido)", async () => {
    mockFetchResolvedOnce({
      status: 401,
      ok: false,
      json: async () => ({
        message: "API error: Check API user.",
        mensagem_pt: "Chave de API inválida.",
      }),
    });

    await expect(new ReceitaWsQsaConsultaAdapter().consultar("19131243000197")).rejects.toThrow(
      "ReceitaWS respondeu 401",
    );
  });

  it("lança erro claro se RECEITAWS_API_TOKEN não está configurada, sem nem chamar o fetch", async () => {
    delete process.env.RECEITAWS_API_TOKEN;

    await expect(new ReceitaWsQsaConsultaAdapter().consultar("19131243000197")).rejects.toThrow(
      "RECEITAWS_API_TOKEN não configurada",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

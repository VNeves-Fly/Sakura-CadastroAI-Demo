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
      situacaoCadastral: null,
      naturezaJuridica: null,
      porte: null,
      capitalSocial: null,
      optanteSimples: false,
      dataOpcaoSimples: null,
      endereco: null,
      cnaes: [
        {
          codigo: "94.30-8-00",
          descricao: "Atividades de associações de defesa de direitos sociais",
          principal: true,
        },
      ],
    });
  });

  it("extrai os campos ampliados (situação cadastral, natureza jurídica, porte, capital social, Simples, endereço, CNAEs secundários) quando presentes", async () => {
    mockFetchResolvedOnce({
      status: 200,
      ok: true,
      json: async () => ({
        status: "OK",
        cnpj: "19131243000197",
        nome: "LARIAN GROUP LTDA",
        situacao: "ATIVA",
        natureza_juridica: "206-2 - Sociedade Empresária Limitada",
        porte: "Demais",
        capital_social: "784.314,00",
        simples: { optante: true, data_opcao: "01/01/2020" },
        logradouro: "Rua Santa Cruz",
        numero: "2187",
        complemento: "sala 10",
        bairro: "Vila Mariana",
        municipio: "São Paulo",
        uf: "SP",
        cep: "04.121-002",
        atividade_principal: [{ code: "79.11-2-00", text: "Agências de viagens" }],
        atividades_secundarias: [{ code: "79.12-1-00", text: "Operadores turísticos" }],
        qsa: [],
        abertura: "16/12/2025",
        telefone: "",
        email: "",
      }),
    });

    const resultado = await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197");

    expect(resultado?.situacaoCadastral).toBe("ATIVA");
    expect(resultado?.naturezaJuridica).toBe("206-2 - Sociedade Empresária Limitada");
    expect(resultado?.porte).toBe("Demais");
    expect(resultado?.capitalSocial).toBe(784314);
    expect(resultado?.optanteSimples).toBe(true);
    expect(resultado?.dataOpcaoSimples).toBe("01/01/2020");
    expect(resultado?.endereco).toEqual({
      logradouro: "Rua Santa Cruz",
      numero: "2187",
      complemento: "sala 10",
      bairro: "Vila Mariana",
      cidade: "São Paulo",
      uf: "SP",
      cep: "04.121-002",
    });
    expect(resultado?.cnaes).toEqual([
      { codigo: "79.11-2-00", descricao: "Agências de viagens", principal: true },
      { codigo: "79.12-1-00", descricao: "Operadores turísticos", principal: false },
    ]);
  });

  it("degrada com segurança os campos ampliados quando ausentes ou em formato inesperado", async () => {
    mockFetchResolvedOnce({
      status: 200,
      ok: true,
      json: async () => ({
        status: "OK",
        nome: "Empresa Sem Dados Extras",
        capital_social: { valor: 123 },
        simples: undefined,
        qsa: [],
        abertura: "01/01/2020",
        telefone: "",
        email: "",
      }),
    });

    const resultado = await new ReceitaWsQsaConsultaAdapter().consultar("19131243000197");

    expect(resultado?.situacaoCadastral).toBeNull();
    expect(resultado?.capitalSocial).toBeNull();
    expect(resultado?.optanteSimples).toBe(false);
    expect(resultado?.dataOpcaoSimples).toBeNull();
    expect(resultado?.endereco).toBeNull();
    expect(resultado?.cnaes).toEqual([]);
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

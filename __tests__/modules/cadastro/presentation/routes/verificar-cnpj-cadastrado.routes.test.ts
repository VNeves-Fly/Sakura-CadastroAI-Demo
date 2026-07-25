const mockVerificarCnpjCadastrado = jest.fn();

jest.mock("@/modules/cadastro/presentation/controllers/cadastro-publico.controller", () => ({
  cadastroPublicoController: {
    verificarCnpjCadastrado: (cnpj: string) => mockVerificarCnpjCadastrado(cnpj),
  },
}));

import { verificarCnpjCadastradoRoute } from "@/modules/cadastro/presentation/routes/cadastro-publico.routes";

function buildRequest(body: unknown, ip = "1.1.1.1"): Request {
  return new Request("http://localhost/api/cadastro/verificar-cnpj", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("verificarCnpjCadastradoRoute", () => {
  beforeEach(() => {
    mockVerificarCnpjCadastrado.mockReset();
  });

  it("retorna 422 quando o CNPJ não é enviado", async () => {
    const request = buildRequest({}, "10.0.0.1");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "CNPJ é obrigatório." });
    expect(mockVerificarCnpjCadastrado).not.toHaveBeenCalled();
  });

  it("retorna 422 quando o CNPJ é uma string vazia", async () => {
    const request = buildRequest({ cnpj: "" }, "10.0.0.2");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(422);
    expect(mockVerificarCnpjCadastrado).not.toHaveBeenCalled();
  });

  it("retorna 422 quando cnpj não é uma string (tipo inesperado no body)", async () => {
    const request = buildRequest({ cnpj: 12345678000195 }, "10.0.0.3");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(422);
    expect(mockVerificarCnpjCadastrado).not.toHaveBeenCalled();
  });

  it("chama o controller com o CNPJ recebido e devolve 200 com o resultado (existe=false)", async () => {
    mockVerificarCnpjCadastrado.mockResolvedValue({ existe: false });
    const request = buildRequest({ cnpj: "12345678000195" }, "10.0.0.4");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ existe: false });
    expect(mockVerificarCnpjCadastrado).toHaveBeenCalledWith("12345678000195");
  });

  it("devolve 200 com existe=true quando o controller confirma cadastro existente", async () => {
    mockVerificarCnpjCadastrado.mockResolvedValue({ existe: true });
    const request = buildRequest({ cnpj: "12345678000195" }, "10.0.0.5");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ existe: true });
  });

  it("mapeia erro inesperado do controller pra 500 genérico (não vaza detalhe interno)", async () => {
    mockVerificarCnpjCadastrado.mockRejectedValue(new Error("conexão com o banco caiu"));
    const request = buildRequest({ cnpj: "12345678000195" }, "10.0.0.6");

    const response = await verificarCnpjCadastradoRoute(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Erro interno do servidor." });
  });

  it("bloqueia com 429 depois de estourar o limite de tentativas pro mesmo IP", async () => {
    mockVerificarCnpjCadastrado.mockResolvedValue({ existe: false });
    const ip = "10.0.0.7";

    // Limite é 30/min (RATE_LIMIT_VERIFICAR_CNPJ) — as primeiras 30 passam.
    for (let i = 0; i < 30; i++) {
      const resposta = await verificarCnpjCadastradoRoute(
        buildRequest({ cnpj: "12345678000195" }, ip),
      );
      expect(resposta.status).toBe(200);
    }

    const resposta31 = await verificarCnpjCadastradoRoute(
      buildRequest({ cnpj: "12345678000195" }, ip),
    );

    expect(resposta31.status).toBe(429);
  });

  it("não compartilha o limite de tentativas entre IPs diferentes", async () => {
    mockVerificarCnpjCadastrado.mockResolvedValue({ existe: false });

    for (let i = 0; i < 30; i++) {
      await verificarCnpjCadastradoRoute(buildRequest({ cnpj: "12345678000195" }, "10.0.0.8"));
    }
    // IP diferente do usado acima — não deve estar rate-limited.
    const resposta = await verificarCnpjCadastradoRoute(
      buildRequest({ cnpj: "12345678000195" }, "10.0.0.9"),
    );

    expect(resposta.status).toBe(200);
  });
});

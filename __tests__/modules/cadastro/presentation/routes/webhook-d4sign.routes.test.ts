import { createHmac } from "crypto";

const mockProcessar = jest.fn();

jest.mock("@/modules/cadastro/presentation/controllers/webhook-d4sign.controller", () => ({
  webhookD4SignController: {
    processar: (input: unknown) => mockProcessar(input),
  },
}));

import { processarWebhookD4SignRoute } from "@/modules/cadastro/presentation/routes/webhook-d4sign.routes";

const originalEnv = process.env;

function buildFormDataRequest(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  const formData = new FormData();
  for (const [chave, valor] of Object.entries(fields)) {
    formData.set(chave, valor);
  }
  return new Request("http://localhost/api/webhooks/d4sign", {
    method: "POST",
    body: formData,
    headers,
  });
}

describe("processarWebhookD4SignRoute", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("retorna 422 se uuid ou type_post estiverem ausentes do form-data", async () => {
    const request = buildFormDataRequest({ type_post: "1" });

    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("uuid e type_post são obrigatórios");
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("processa sem checar HMAC quando D4SIGN_WEBHOOK_SECRET não está configurada (fora de produção)", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildFormDataRequest({ uuid: "doc-1", type_post: "1" });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ processado: true });
    expect(mockProcessar).toHaveBeenCalledWith({ provedorId: "doc-1", typePost: "1" });
  });

  it("bloqueia com 500 em produção quando D4SIGN_WEBHOOK_SECRET não está configurada (fail-closed)", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.D4SIGN_WEBHOOK_SECRET;

    const request = buildFormDataRequest({ uuid: "doc-1", type_post: "1" });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(500);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("rejeita com 401 quando D4SIGN_WEBHOOK_SECRET está configurada e o HMAC não bate", async () => {
    process.env = { ...originalEnv, D4SIGN_WEBHOOK_SECRET: "segredo" };

    const request = buildFormDataRequest(
      { uuid: "doc-1", type_post: "1" },
      { "content-hmac": "sha256=assinatura-errada" },
    );
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(401);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("rejeita com 401 quando D4SIGN_WEBHOOK_SECRET está configurada e o header não veio", async () => {
    process.env = { ...originalEnv, D4SIGN_WEBHOOK_SECRET: "segredo" };

    const request = buildFormDataRequest({ uuid: "doc-1", type_post: "1" });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(401);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("aceita quando o HMAC bate (sha256 do uuid do documento com a secret)", async () => {
    process.env = { ...originalEnv, D4SIGN_WEBHOOK_SECRET: "segredo" };
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const assinaturaCorreta = `sha256=${createHmac("sha256", "segredo").update("doc-1").digest("hex")}`;
    const request = buildFormDataRequest(
      { uuid: "doc-1", type_post: "1" },
      { "content-hmac": assinaturaCorreta },
    );
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ provedorId: "doc-1", typePost: "1" });
  });

  it("repassa o e-mail do signatário quando presente no form-data (typePost 4)", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildFormDataRequest({
      uuid: "doc-1",
      type_post: "4",
      email: "cadastro@sakuratur.com.br",
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({
      provedorId: "doc-1",
      typePost: "4",
      email: "cadastro@sakuratur.com.br",
    });
  });

  it("repassa email e message quando presentes no form-data (typePost 2 — e-mail não entregue)", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildFormDataRequest({
      uuid: "doc-1",
      type_post: "2",
      email: "socio@agencia.com",
      message: "Caixa de entrada cheia",
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({
      provedorId: "doc-1",
      typePost: "2",
      email: "socio@agencia.com",
      message: "Caixa de entrada cheia",
    });
  });

  it("sempre responde 200 mesmo quando o use-case não reconhece o evento (evita retry do D4Sign)", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: false, motivo: "Contrato não encontrado." });

    const request = buildFormDataRequest({ uuid: "doc-desconhecido", type_post: "1" });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      processado: false,
      motivo: "Contrato não encontrado.",
    });
  });
});

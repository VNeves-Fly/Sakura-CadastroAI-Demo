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

function buildJsonRequest(
  body: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/webhooks/d4sign", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("processarWebhookD4SignRoute", () => {
  afterEach(() => {
    process.env = originalEnv;
    mockProcessar.mockClear();
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

  it("processa um payload JSON (content-type: application/json) do mesmo jeito que form-data — incidente em prod, 2026-07-27: request.formData() lançava ERR_FORMDATA_PARSE_ERROR pra esse content-type", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildJsonRequest({ uuid: "doc-1", type_post: "1" });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ provedorId: "doc-1", typePost: "1" });
  });

  it("aceita type_post como número no JSON do webhook 2.0 (form-data só produz string, mas JSON pode servir number) e normaliza pra string", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = new Request("http://localhost/api/webhooks/d4sign", {
      method: "POST",
      body: JSON.stringify({ uuid: "doc-1", type_post: 1 }),
      headers: { "content-type": "application/json" },
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ provedorId: "doc-1", typePost: "1" });
  });

  it("extrai o e-mail de signer.email no JSON do webhook 2.0 (typePost 4 — não vem em email na raiz)", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = new Request("http://localhost/api/webhooks/d4sign", {
      method: "POST",
      body: JSON.stringify({
        uuid: "doc-1",
        type_post: "4",
        message: "Signed",
        signer: { uuid: "signer-uuid", email: "cadastro@sakuratur.com.br" },
      }),
      headers: { "content-type": "application/json" },
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({
      provedorId: "doc-1",
      typePost: "4",
      email: "cadastro@sakuratur.com.br",
      message: "Signed",
    });
  });

  it("monta message a partir de error_details no JSON do webhook 2.0 (typePost 2 — message na raiz é só um rótulo fixo)", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = new Request("http://localhost/api/webhooks/d4sign", {
      method: "POST",
      body: JSON.stringify({
        uuid: "doc-1",
        type_post: "2",
        message: "E-mail not sent",
        signer: { uuid: "signer-uuid", email: "socio@agencia.com" },
        error_details: {
          category: "Mailbox unavailable",
          reason: "Caixa de entrada cheia",
          smtp_code: "552",
          diagnostic_message: "5.2.2 mailbox full",
        },
      }),
      headers: { "content-type": "application/json" },
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({
      provedorId: "doc-1",
      typePost: "2",
      email: "socio@agencia.com",
      message: "Mailbox unavailable — Caixa de entrada cheia — 5.2.2 mailbox full",
    });
  });

  it("retorna 422 (não 500) quando o corpo não é decodificável no content-type declarado, em vez de derrubar a rota", async () => {
    process.env = { ...originalEnv };
    delete process.env.D4SIGN_WEBHOOK_SECRET;

    const request = new Request("http://localhost/api/webhooks/d4sign", {
      method: "POST",
      body: "isso não é form-data nem json válido",
      headers: { "content-type": "multipart/form-data" },
    });
    const response = await processarWebhookD4SignRoute(request);

    expect(response.status).toBe(422);
    expect(mockProcessar).not.toHaveBeenCalled();
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

import { createHmac } from "crypto";

const mockProcessar = jest.fn();

jest.mock("@/modules/cadastro/presentation/controllers/webhook-legitimuz.controller", () => ({
  webhookLegitimuzController: {
    processar: (input: unknown) => mockProcessar(input),
  },
}));

import { processarWebhookLegitimuzRoute } from "@/modules/cadastro/presentation/routes/webhook-legitimuz.routes";

const originalEnv = process.env;

function buildJsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/legitimuz", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("processarWebhookLegitimuzRoute", () => {
  afterEach(() => {
    process.env = originalEnv;
    mockProcessar.mockClear();
  });

  it("retorna 422 se ref_id ou status estiverem ausentes", async () => {
    process.env = { ...originalEnv };
    delete process.env.LEGITIMUZ_WEBHOOK_SECRET;

    const request = buildJsonRequest({ personId: "123" });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(422);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("processa sem checar HMAC quando LEGITIMUZ_WEBHOOK_SECRET não está configurada (fora de produção)", async () => {
    process.env = { ...originalEnv, NODE_ENV: "test" };
    delete process.env.LEGITIMUZ_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildJsonRequest({ status: "Aprovado", ref_id: "token-1", personId: "123" });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ refId: "token-1", status: "Aprovado" });
  });

  it("bloqueia com 500 em produção quando LEGITIMUZ_WEBHOOK_SECRET não está configurada (fail-closed)", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.LEGITIMUZ_WEBHOOK_SECRET;

    const request = buildJsonRequest({ status: "Aprovado", ref_id: "token-1" });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(500);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("rejeita com 401 quando a assinatura não bate", async () => {
    process.env = { ...originalEnv, LEGITIMUZ_WEBHOOK_SECRET: "segredo" };

    const request = buildJsonRequest(
      { status: "Aprovado", ref_id: "token-1" },
      { "x-signature": "sha256=errada" },
    );
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(401);
    expect(mockProcessar).not.toHaveBeenCalled();
  });

  it("aceita quando a assinatura HMAC-SHA256 do corpo bruto bate (com prefixo sha256=)", async () => {
    process.env = { ...originalEnv, LEGITIMUZ_WEBHOOK_SECRET: "segredo" };
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const payload = { status: "Aprovado", ref_id: "token-1", personId: "123" };
    const rawBody = JSON.stringify(payload);
    const assinatura = `sha256=${createHmac("sha256", "segredo").update(rawBody, "utf8").digest("hex")}`;

    const request = new Request("http://localhost/api/webhooks/legitimuz", {
      method: "POST",
      body: rawBody,
      headers: { "content-type": "application/json", "x-signature": assinatura },
    });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ refId: "token-1", status: "Aprovado" });
  });

  it("extrai ref_id/status de validationPerson.meta no payload de atualização de revisão manual", async () => {
    process.env = { ...originalEnv };
    delete process.env.LEGITIMUZ_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: true });

    const request = buildJsonRequest({
      type: "update",
      message: "Successfully Processed",
      validationPerson: {
        id: "10124584",
        meta: { status: "Aprovado", ref_id: "token-1" },
      },
      personId: "10124584",
    });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(200);
    expect(mockProcessar).toHaveBeenCalledWith({ refId: "token-1", status: "Aprovado" });
  });

  it("sempre responde 200 mesmo quando o use-case não reconhece o evento (evita retry)", async () => {
    process.env = { ...originalEnv };
    delete process.env.LEGITIMUZ_WEBHOOK_SECRET;
    mockProcessar.mockResolvedValueOnce({ processado: false, motivo: "não encontrada" });

    const request = buildJsonRequest({ status: "Aprovado", ref_id: "token-desconhecido" });
    const response = await processarWebhookLegitimuzRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ processado: false, motivo: "não encontrada" });
  });
});

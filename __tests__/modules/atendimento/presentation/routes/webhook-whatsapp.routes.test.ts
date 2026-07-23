import { createHmac } from "crypto";

const mockProcessarInbound = jest.fn();
const mockAtualizarStatus = jest.fn();

jest.mock("@/modules/atendimento/presentation/controllers/webhook-whatsapp.controller", () => ({
  webhookWhatsAppController: {
    processarInbound: (input: unknown) => mockProcessarInbound(input),
    atualizarStatus: (input: unknown) => mockAtualizarStatus(input),
  },
}));

import {
  processarWebhookWhatsAppRoute,
  verificarWebhookWhatsAppRoute,
} from "@/modules/atendimento/presentation/routes/webhook-whatsapp.routes";

const originalEnv = process.env;

function buildPostRequest(rawBody: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/whatsapp", {
    method: "POST",
    body: rawBody,
    headers,
  });
}

function assinar(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
}

describe("verificarWebhookWhatsAppRoute", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("devolve o challenge em texto puro quando mode/token/challenge batem", async () => {
    process.env = { ...originalEnv, WHATSAPP_WEBHOOK_VERIFY_TOKEN: "meu-token" };
    const request = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=meu-token&hub.challenge=12345",
    );

    const response = verificarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(await response.text()).toBe("12345");
  });

  it("responde 403 quando o verify_token não bate", async () => {
    process.env = { ...originalEnv, WHATSAPP_WEBHOOK_VERIFY_TOKEN: "meu-token" };
    const request = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=12345",
    );

    const response = verificarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(403);
  });

  it("responde 403 quando mode não é subscribe ou challenge está ausente", async () => {
    process.env = { ...originalEnv, WHATSAPP_WEBHOOK_VERIFY_TOKEN: "meu-token" };
    const semChallenge = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=meu-token",
    );
    const modeErrado = new Request(
      "http://localhost/api/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=meu-token&hub.challenge=1",
    );

    expect(verificarWebhookWhatsAppRoute(semChallenge).status).toBe(403);
    expect(verificarWebhookWhatsAppRoute(modeErrado).status).toBe(403);
  });
});

describe("processarWebhookWhatsAppRoute", () => {
  afterEach(() => {
    process.env = originalEnv;
    mockProcessarInbound.mockReset();
    mockAtualizarStatus.mockReset();
  });

  it("bloqueia com 500 quando WHATSAPP_APP_SECRET não está configurada (fail-closed)", async () => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_APP_SECRET;

    const request = buildPostRequest("{}");
    const response = await processarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(500);
    expect(mockProcessarInbound).not.toHaveBeenCalled();
  });

  it("rejeita com 401 quando a assinatura não bate", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };
    const request = buildPostRequest("{}", { "x-hub-signature-256": "sha256=assinatura-errada" });

    const response = await processarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(401);
    expect(mockProcessarInbound).not.toHaveBeenCalled();
  });

  it("rejeita com 401 quando o header de assinatura está ausente", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };
    const request = buildPostRequest("{}");

    const response = await processarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(401);
  });

  it("com assinatura válida, processa a mensagem de texto e responde 200 com as contagens", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };
    mockProcessarInbound.mockResolvedValue({ id: "msg-1" });

    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Cliente Teste" }, wa_id: "5511988887777" }],
                messages: [
                  {
                    from: "5511988887777",
                    id: "wamid.1",
                    timestamp: "1690000000",
                    type: "text",
                    text: { body: "Oi, preciso de ajuda" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const request = buildPostRequest(rawBody, {
      "x-hub-signature-256": assinar(rawBody, "segredo"),
    });

    const response = await processarWebhookWhatsAppRoute(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ recebidas: 1, status: 0 });
    expect(mockProcessarInbound).toHaveBeenCalledWith({
      telefoneWhatsapp: "5511988887777",
      nomePerfil: "Cliente Teste",
      tipo: "texto",
      conteudo: "Oi, preciso de ajuda",
      waMessageId: "wamid.1",
      mediaId: undefined,
      duracaoSegundos: undefined,
    });
  });

  it("repassa mensagem de mídia com o mediaId como conteudo de fallback (sem texto)", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };
    mockProcessarInbound.mockResolvedValue({ id: "msg-1" });

    const rawBody = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                contacts: [],
                messages: [
                  {
                    from: "5511988887777",
                    id: "wamid.2",
                    timestamp: "1",
                    type: "image",
                    image: { id: "media-abc", mime_type: "image/jpeg" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const request = buildPostRequest(rawBody, {
      "x-hub-signature-256": assinar(rawBody, "segredo"),
    });

    await processarWebhookWhatsAppRoute(request);

    expect(mockProcessarInbound).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: "imagem", conteudo: "media-abc", mediaId: "media-abc" }),
    );
  });

  it("ignora mensagens de tipo não suportado, sem chamar o controller pra elas", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };

    const rawBody = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                contacts: [],
                messages: [
                  { from: "5511988887777", id: "wamid.3", timestamp: "1", type: "sticker" },
                ],
              },
            },
          ],
        },
      ],
    });
    const request = buildPostRequest(rawBody, {
      "x-hub-signature-256": assinar(rawBody, "segredo"),
    });

    const response = await processarWebhookWhatsAppRoute(request);

    expect(mockProcessarInbound).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ recebidas: 1, status: 0 });
  });

  it("processa atualizações de status separadamente das mensagens recebidas", async () => {
    process.env = { ...originalEnv, WHATSAPP_APP_SECRET: "segredo" };
    mockAtualizarStatus.mockResolvedValue(undefined);

    const rawBody = JSON.stringify({
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                statuses: [{ id: "wamid.enviado", status: "delivered" }],
              },
            },
          ],
        },
      ],
    });
    const request = buildPostRequest(rawBody, {
      "x-hub-signature-256": assinar(rawBody, "segredo"),
    });

    const response = await processarWebhookWhatsAppRoute(request);

    expect(mockAtualizarStatus).toHaveBeenCalledWith({
      waMessageId: "wamid.enviado",
      status: "delivered",
    });
    expect(mockProcessarInbound).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ recebidas: 0, status: 1 });
  });
});

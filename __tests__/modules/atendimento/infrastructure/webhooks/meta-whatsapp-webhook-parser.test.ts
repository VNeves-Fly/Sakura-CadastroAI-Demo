import { parseWebhookWhatsApp } from "@/modules/atendimento/infrastructure/webhooks/meta-whatsapp-webhook-parser";

function buildPayload(value: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA_ID",
        changes: [{ field: "messages", value: { messaging_product: "whatsapp", ...value } }],
      },
    ],
  };
}

describe("parseWebhookWhatsApp", () => {
  it("mapeia mensagem de texto, casando o nome do contato pelo wa_id (não pelo índice)", () => {
    const payload = buildPayload({
      contacts: [{ profile: { name: "João Silva" }, wa_id: "5511999999999" }],
      messages: [
        {
          from: "5511999999999",
          id: "wamid.1",
          timestamp: "1690000000",
          type: "text",
          text: { body: "Oi" },
        },
      ],
    });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas).toEqual([
      {
        waMessageId: "wamid.1",
        deWaId: "5511999999999",
        nomePerfil: "João Silva",
        tipo: "texto",
        conteudoTexto: "Oi",
        midia: null,
      },
    ]);
  });

  it("casa o contato certo mesmo quando contacts[] e messages[] estão em ordens diferentes", () => {
    const payload = buildPayload({
      contacts: [
        { profile: { name: "Segunda Pessoa" }, wa_id: "5511222222222" },
        { profile: { name: "Primeira Pessoa" }, wa_id: "5511111111111" },
      ],
      messages: [
        { from: "5511111111111", id: "wamid.1", timestamp: "1", type: "text", text: { body: "a" } },
        { from: "5511222222222", id: "wamid.2", timestamp: "2", type: "text", text: { body: "b" } },
      ],
    });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas[0]?.nomePerfil).toBe("Primeira Pessoa");
    expect(resultado.mensagensRecebidas[1]?.nomePerfil).toBe("Segunda Pessoa");
  });

  it("nomePerfil vem null quando não há contato correspondente", () => {
    const payload = buildPayload({
      contacts: [],
      messages: [
        {
          from: "5511999999999",
          id: "wamid.1",
          timestamp: "1",
          type: "text",
          text: { body: "Oi" },
        },
      ],
    });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas[0]?.nomePerfil).toBeNull();
  });

  it.each([
    ["audio", { audio: { id: "media-1", mime_type: "audio/ogg" } }, "audio", "audio/ogg"],
    ["image", { image: { id: "media-2", mime_type: "image/jpeg" } }, "imagem", "image/jpeg"],
    [
      "document",
      { document: { id: "media-3", mime_type: "application/pdf" } },
      "pdf",
      "application/pdf",
    ],
  ])(
    "mapeia mensagem tipo %s pro nosso tipo %s com mediaId/mimeType",
    (metaType, campo, tipoEsperado, mimeEsperado) => {
      const payload = buildPayload({
        contacts: [],
        messages: [
          { from: "5511999999999", id: "wamid.1", timestamp: "1", type: metaType, ...campo },
        ],
      });

      const resultado = parseWebhookWhatsApp(payload);

      expect(resultado.mensagensRecebidas[0]).toEqual(
        expect.objectContaining({
          tipo: tipoEsperado,
          conteudoTexto: null,
          midia: { mediaId: expect.stringContaining("media-"), mimeType: mimeEsperado },
        }),
      );
    },
  );

  it("marca tipos não suportados (sticker, vídeo, etc.) como nao_suportado em vez de descartar", () => {
    const payload = buildPayload({
      contacts: [],
      messages: [{ from: "5511999999999", id: "wamid.1", timestamp: "1", type: "sticker" }],
    });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas[0]).toEqual(
      expect.objectContaining({ tipo: "nao_suportado", conteudoTexto: null, midia: null }),
    );
  });

  it("mapeia statuses conhecidos (sent/delivered/read/failed)", () => {
    const payload = buildPayload({
      statuses: [
        { id: "wamid.1", status: "sent" },
        { id: "wamid.2", status: "delivered" },
        { id: "wamid.3", status: "read" },
        { id: "wamid.4", status: "failed" },
      ],
    });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.statusAtualizados).toEqual([
      { waMessageId: "wamid.1", status: "sent" },
      { waMessageId: "wamid.2", status: "delivered" },
      { waMessageId: "wamid.3", status: "read" },
      { waMessageId: "wamid.4", status: "failed" },
    ]);
  });

  it("ignora status desconhecido em vez de quebrar", () => {
    const payload = buildPayload({ statuses: [{ id: "wamid.1", status: "warehoused" }] });

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.statusAtualizados).toEqual([]);
  });

  it("ignora changes cujo messaging_product não é whatsapp (multiplexação de outros produtos)", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "outro_produto",
                messages: [
                  {
                    from: "5511999999999",
                    id: "wamid.1",
                    timestamp: "1",
                    type: "text",
                    text: { body: "x" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas).toEqual([]);
  });

  it("devolve arrays vazios pra payload sem entry/changes/messages", () => {
    expect(parseWebhookWhatsApp({})).toEqual({ mensagensRecebidas: [], statusAtualizados: [] });
    expect(parseWebhookWhatsApp({ entry: [] })).toEqual({
      mensagensRecebidas: [],
      statusAtualizados: [],
    });
    expect(parseWebhookWhatsApp({ entry: [{ id: "x", changes: [] }] })).toEqual({
      mensagensRecebidas: [],
      statusAtualizados: [],
    });
  });

  it("percorre múltiplos entries/changes no mesmo payload", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [],
                messages: [
                  { from: "1", id: "wamid.1", timestamp: "1", type: "text", text: { body: "a" } },
                ],
              },
            },
          ],
        },
        {
          id: "WABA_2",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [],
                messages: [
                  { from: "2", id: "wamid.2", timestamp: "2", type: "text", text: { body: "b" } },
                ],
              },
            },
          ],
        },
      ],
    };

    const resultado = parseWebhookWhatsApp(payload);

    expect(resultado.mensagensRecebidas).toHaveLength(2);
    expect(resultado.mensagensRecebidas.map((m) => m.waMessageId)).toEqual(["wamid.1", "wamid.2"]);
  });
});

import { MockWhatsAppMessagingAdapter } from "@/modules/atendimento/infrastructure/adapters/mock-whatsapp-messaging.adapter";

describe("MockWhatsAppMessagingAdapter", () => {
  it("enviarTexto devolve um waMessageId fake", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const resultado = await adapter.enviarTexto("5511999999999", "oi");

    expect(resultado.waMessageId).toMatch(/^wamid\.MOCK/);
  });

  it("cada envio gera um waMessageId diferente do anterior", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const primeiro = await adapter.enviarTexto("5511999999999", "a");
    const segundo = await adapter.enviarTemplate("5511999999999", "tpl", "pt_BR");

    expect(primeiro.waMessageId).not.toBe(segundo.waMessageId);
  });

  it("enviarMidia também devolve um waMessageId fake", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const resultado = await adapter.enviarMidia("5511999999999", "pdf", {
      buffer: Buffer.from("x"),
      mimeType: "application/pdf",
    });

    expect(resultado.waMessageId).toMatch(/^wamid\.MOCK/);
  });

  it("listarTemplatesAprovados devolve pelo menos um template de exemplo", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const templates = await adapter.listarTemplatesAprovados();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toEqual(
      expect.objectContaining({ metaTemplateId: expect.any(String), nome: expect.any(String) }),
    );
  });

  it("baixarMidia devolve um buffer e mimeType placeholder sem chamar rede nenhuma", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const resultado = await adapter.baixarMidia("media-123");

    expect(resultado.buffer).toBeInstanceOf(Buffer);
    expect(resultado.buffer.toString()).toContain("media-123");
    expect(resultado.mimeType).toBe("application/octet-stream");
  });
});

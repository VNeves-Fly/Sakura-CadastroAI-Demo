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

  it("listarTodosTemplates devolve pelo menos um template de exemplo com status", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const templates = await adapter.listarTodosTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toEqual(
      expect.objectContaining({ status: "APPROVED", motivoRejeicao: null }),
    );
  });

  it("criarTemplate devolve um metaTemplateId fake sem chamar rede", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    const resultado = await adapter.criarTemplate({
      nome: "x",
      categoria: "UTILITY",
      idioma: "pt_BR",
      conteudo: "y",
    });

    expect(resultado.metaTemplateId).toMatch(/^mock-template-/);
  });

  it("editarTemplate é um no-op que não lança erro", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    await expect(adapter.editarTemplate("meta-tpl-1", "novo texto")).resolves.toBeUndefined();
  });

  it("verificarCredenciais lança erro explicando que precisa configurar o .env", async () => {
    const adapter = new MockWhatsAppMessagingAdapter();

    await expect(adapter.verificarCredenciais()).rejects.toThrow("WHATSAPP_ACCESS_TOKEN");
  });
});

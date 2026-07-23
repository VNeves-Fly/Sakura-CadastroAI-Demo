import { MetaWhatsAppAdapter } from "@/modules/atendimento/infrastructure/adapters/meta-whatsapp.adapter";
import { RateLimitError } from "@/modules/shared/domain/errors";
import { ForaDaJanela24hError } from "@/modules/atendimento/domain/errors";

const originalEnv = process.env;

function setEnv(overrides: Record<string, string> = {}) {
  process.env = {
    ...originalEnv,
    WHATSAPP_ACCESS_TOKEN: "token-teste",
    WHATSAPP_PHONE_NUMBER_ID: "phone-id-teste",
    WHATSAPP_BUSINESS_ACCOUNT_ID: "waba-id-teste",
    WHATSAPP_API_BASE_URL: "https://api.teste.whatsapp",
    ...overrides,
  };
}

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errJson(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe("MetaWhatsAppAdapter", () => {
  beforeEach(() => {
    setEnv();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("enviarTexto", () => {
    it("chama /messages com o corpo certo e normaliza o número (remove +, espaços, parênteses, traços)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({ messages: [{ id: "wamid.123" }] }),
      );

      const resultado = await new MetaWhatsAppAdapter().enviarTexto("+55 (11) 99999-9999", "Olá!");

      expect(resultado).toEqual({ waMessageId: "wamid.123" });
      const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://api.teste.whatsapp/phone-id-teste/messages");
      expect(opts.headers.Authorization).toBe("Bearer token-teste");
      expect(JSON.parse(opts.body)).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "5511999999999",
        type: "text",
        text: { preview_url: false, body: "Olá!" },
      });
    });

    it("lança erro descritivo se a resposta não tem messages[0].id", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({}));

      await expect(new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi")).rejects.toThrow(
        "Resposta da Meta sem messages[0].id.",
      );
    });
  });

  describe("enviarTemplate", () => {
    it("omite `components` quando não há parâmetros", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({ messages: [{ id: "wamid.tpl" }] }),
      );

      await new MetaWhatsAppAdapter().enviarTemplate("5511999999999", "boas_vindas", "pt_BR");

      const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({
        messaging_product: "whatsapp",
        to: "5511999999999",
        type: "template",
        template: { name: "boas_vindas", language: { code: "pt_BR" } },
      });
    });

    it("monta components.body.parameters quando há parâmetros", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({ messages: [{ id: "wamid.tpl" }] }),
      );

      await new MetaWhatsAppAdapter().enviarTemplate("5511999999999", "boas_vindas", "pt_BR", [
        "Fulano",
        "123",
      ]);

      const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(opts.body).template.components).toEqual([
        {
          type: "body",
          parameters: [
            { type: "text", text: "Fulano" },
            { type: "text", text: "123" },
          ],
        },
      ]);
    });
  });

  describe("enviarMidia", () => {
    it("faz upload da mídia e depois envia a mensagem referenciando o media_id (2 chamadas)", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okJson({ id: "media-id-abc" }))
        .mockResolvedValueOnce(okJson({ messages: [{ id: "wamid.midia" }] }));

      const resultado = await new MetaWhatsAppAdapter().enviarMidia("5511999999999", "imagem", {
        buffer: Buffer.from("bytes-da-imagem"),
        mimeType: "image/jpeg",
        filename: "foto.jpg",
      });

      expect(resultado).toEqual({ waMessageId: "wamid.midia" });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      const [uploadUrl, uploadOpts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(uploadUrl).toBe("https://api.teste.whatsapp/phone-id-teste/media");
      expect(uploadOpts.body).toBeInstanceOf(FormData);
      expect((uploadOpts.body as FormData).get("messaging_product")).toBe("whatsapp");

      const [, sendOpts] = (global.fetch as jest.Mock).mock.calls[1];
      expect(JSON.parse(sendOpts.body)).toEqual({
        messaging_product: "whatsapp",
        to: "5511999999999",
        type: "image",
        image: { id: "media-id-abc" },
      });
    });

    it("tipo pdf manda `document` com filename; audio/imagem não mandam filename", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okJson({ id: "media-pdf" }))
        .mockResolvedValueOnce(okJson({ messages: [{ id: "wamid.pdf" }] }));

      await new MetaWhatsAppAdapter().enviarMidia("5511999999999", "pdf", {
        buffer: Buffer.from("bytes"),
        mimeType: "application/pdf",
        filename: "contrato.pdf",
      });

      const [, sendOpts] = (global.fetch as jest.Mock).mock.calls[1];
      expect(JSON.parse(sendOpts.body).document).toEqual({
        id: "media-pdf",
        filename: "contrato.pdf",
      });
    });

    it("lança erro descritivo se o upload da mídia falhar (sem passar pelo mapeamento de erro da Meta)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        errJson(400, { error: { message: "arquivo inválido" } }),
      );

      await expect(
        new MetaWhatsAppAdapter().enviarMidia("5511999999999", "pdf", {
          buffer: Buffer.from("x"),
          mimeType: "application/pdf",
        }),
      ).rejects.toThrow("Meta media upload respondeu 400");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("listarTemplatesAprovados", () => {
    it("achata só o componente BODY pro campo conteudo, ignorando header/footer/buttons", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({
          data: [
            {
              id: "tpl-1",
              name: "boas_vindas",
              language: "pt_BR",
              status: "APPROVED",
              components: [
                { type: "HEADER", format: "TEXT", text: "Bem-vindo!" },
                { type: "BODY", text: "Olá {{1}}, seu cadastro foi recebido." },
                { type: "FOOTER", text: "Sakura Travel" },
              ],
            },
          ],
        }),
      );

      const templates = await new MetaWhatsAppAdapter().listarTemplatesAprovados();

      expect(templates).toEqual([
        {
          metaTemplateId: "tpl-1",
          nome: "boas_vindas",
          idioma: "pt_BR",
          conteudo: "Olá {{1}}, seu cadastro foi recebido.",
        },
      ]);
    });

    it("segue a paginação via paging.next até acabar", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          okJson({
            data: [
              { id: "tpl-1", name: "a", language: "pt_BR", status: "APPROVED", components: [] },
            ],
            paging: {
              next: "https://api.teste.whatsapp/waba-id-teste/message_templates?after=cursor1",
            },
          }),
        )
        .mockResolvedValueOnce(
          okJson({
            data: [
              { id: "tpl-2", name: "b", language: "pt_BR", status: "APPROVED", components: [] },
            ],
          }),
        );

      const templates = await new MetaWhatsAppAdapter().listarTemplatesAprovados();

      expect(templates.map((t) => t.metaTemplateId)).toEqual(["tpl-1", "tpl-2"]);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(
        "https://api.teste.whatsapp/waba-id-teste/message_templates?after=cursor1",
      );
    });

    it("filtra defensivamente qualquer item que não esteja com status APPROVED", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({
          data: [
            { id: "tpl-pending", name: "x", language: "pt_BR", status: "PENDING", components: [] },
            { id: "tpl-ok", name: "y", language: "pt_BR", status: "APPROVED", components: [] },
          ],
        }),
      );

      const templates = await new MetaWhatsAppAdapter().listarTemplatesAprovados();

      expect(templates.map((t) => t.metaTemplateId)).toEqual(["tpl-ok"]);
    });

    it("conteudo vazio quando o template não tem componente BODY (não deve quebrar a listagem)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({
          data: [
            {
              id: "tpl-sem-body",
              name: "z",
              language: "pt_BR",
              status: "APPROVED",
              components: [],
            },
          ],
        }),
      );

      const templates = await new MetaWhatsAppAdapter().listarTemplatesAprovados();

      expect(templates[0]?.conteudo).toBe("");
    });
  });

  describe("baixarMidia", () => {
    it("faz o lookup do media_id e depois baixa os bytes da CDN, ambos com o Bearer", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          okJson({ url: "https://cdn.meta/arquivo", mime_type: "audio/ogg; codecs=opus" }),
        )
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          arrayBuffer: async () => new TextEncoder().encode("audio-bytes").buffer,
        });

      const resultado = await new MetaWhatsAppAdapter().baixarMidia("media-1");

      expect(resultado.mimeType).toBe("audio/ogg");
      expect(Buffer.from(resultado.buffer).toString()).toBe("audio-bytes");

      const [lookupUrl, lookupOpts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(lookupUrl).toBe("https://api.teste.whatsapp/media-1");
      expect(lookupOpts.headers.Authorization).toBe("Bearer token-teste");

      const [cdnUrl, cdnOpts] = (global.fetch as jest.Mock).mock.calls[1];
      expect(cdnUrl).toBe("https://cdn.meta/arquivo");
      expect(cdnOpts.headers.Authorization).toBe("Bearer token-teste");
    });

    it("lança erro descritivo se o lookup do media_id falhar", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(new MetaWhatsAppAdapter().baixarMidia("media-inexistente")).rejects.toThrow(
        "Meta media lookup media-inexistente respondeu 404",
      );
    });

    it("lança erro descritivo se o download da CDN falhar", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(okJson({ url: "https://cdn.meta/arquivo", mime_type: "image/jpeg" }))
        .mockResolvedValueOnce({ ok: false, status: 410 });

      await expect(new MetaWhatsAppAdapter().baixarMidia("media-1")).rejects.toThrow(
        "Meta media CDN media-1 respondeu 410",
      );
    });
  });

  describe("mapeamento de erros da Meta", () => {
    it("código 131047 (fora da janela de 24h) vira ForaDaJanela24hError", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        errJson(400, { error: { code: 131047, message: "Re-engagement message" } }),
      );

      await expect(new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi")).rejects.toThrow(
        ForaDaJanela24hError,
      );
    });

    it.each([131056, 130429])("código %d (rate limit) vira RateLimitError", async (codigo) => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errJson(429, { error: { code: codigo } }));

      await expect(new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi")).rejects.toThrow(
        RateLimitError,
      );
    });

    it("qualquer outro erro vira um Error genérico com a url e o status", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        errJson(401, { error: { code: 190, message: "Invalid OAuth access token" } }),
      );

      await expect(new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi")).rejects.toThrow(
        "WhatsApp Cloud API https://api.teste.whatsapp/phone-id-teste/messages respondeu 401",
      );
    });
  });

  describe("variáveis de ambiente obrigatórias", () => {
    it.each(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"])(
      "lança erro claro se %s não está configurada ao enviar texto",
      async (envVar) => {
        setEnv();
        delete process.env[envVar];

        await expect(new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi")).rejects.toThrow(
          `${envVar} não configurada`,
        );
        expect(global.fetch).not.toHaveBeenCalled();
      },
    );

    it("lança erro claro se WHATSAPP_BUSINESS_ACCOUNT_ID não está configurada ao listar templates", async () => {
      delete process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

      await expect(new MetaWhatsAppAdapter().listarTemplatesAprovados()).rejects.toThrow(
        "WHATSAPP_BUSINESS_ACCOUNT_ID não configurada",
      );
    });

    it("usa o default da Graph API quando WHATSAPP_API_BASE_URL não está configurada", async () => {
      setEnv({ WHATSAPP_API_BASE_URL: "" });
      delete process.env.WHATSAPP_API_BASE_URL;
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ messages: [{ id: "wamid.1" }] }));

      await new MetaWhatsAppAdapter().enviarTexto("5511999999999", "oi");

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://graph.facebook.com/v21.0/phone-id-teste/messages");
    });
  });

  describe("listarTodosTemplates", () => {
    it("traz qualquer status (não filtra como listarTemplatesAprovados) e o motivo de rejeição", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({
          data: [
            {
              id: "tpl-1",
              name: "boas_vindas",
              language: "pt_BR",
              status: "APPROVED",
              category: "UTILITY",
              components: [{ type: "BODY", text: "Olá!" }],
            },
            {
              id: "tpl-2",
              name: "promocao",
              language: "pt_BR",
              status: "REJECTED",
              category: "MARKETING",
              rejected_reason: "Texto genérico demais.",
              components: [{ type: "BODY", text: "Aproveite!" }],
            },
          ],
        }),
      );

      const templates = await new MetaWhatsAppAdapter().listarTodosTemplates();

      expect(templates).toEqual([
        {
          metaTemplateId: "tpl-1",
          nome: "boas_vindas",
          idioma: "pt_BR",
          categoria: "UTILITY",
          status: "APPROVED",
          motivoRejeicao: null,
          conteudo: "Olá!",
        },
        {
          metaTemplateId: "tpl-2",
          nome: "promocao",
          idioma: "pt_BR",
          categoria: "MARKETING",
          status: "REJECTED",
          motivoRejeicao: "Texto genérico demais.",
          conteudo: "Aproveite!",
        },
      ]);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://api.teste.whatsapp/waba-id-teste/message_templates");
    });
  });

  describe("criarTemplate", () => {
    it("submete o template com o componente BODY e devolve o metaTemplateId", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ id: "novo-tpl-id" }));

      const resultado = await new MetaWhatsAppAdapter().criarTemplate({
        nome: "boas_vindas",
        categoria: "UTILITY",
        idioma: "pt_BR",
        conteudo: "Olá, seja bem-vindo!",
      });

      expect(resultado).toEqual({ metaTemplateId: "novo-tpl-id" });
      const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://api.teste.whatsapp/waba-id-teste/message_templates");
      expect(JSON.parse(opts.body)).toEqual({
        name: "boas_vindas",
        category: "UTILITY",
        language: "pt_BR",
        components: [{ type: "BODY", text: "Olá, seja bem-vindo!" }],
      });
    });
  });

  describe("editarTemplate", () => {
    it("chama POST /{metaTemplateId} com o novo componente BODY", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okJson({ success: true }));

      await new MetaWhatsAppAdapter().editarTemplate("meta-tpl-1", "Texto corrigido");

      const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe("https://api.teste.whatsapp/meta-tpl-1");
      expect(JSON.parse(opts.body)).toEqual({
        components: [{ type: "BODY", text: "Texto corrigido" }],
      });
    });
  });

  describe("verificarCredenciais", () => {
    it("faz GET no próprio phone number e devolve display_phone_number/verified_name", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okJson({ display_phone_number: "+55 11 99999-9999", verified_name: "Sakura Travel" }),
      );

      const resultado = await new MetaWhatsAppAdapter().verificarCredenciais();

      expect(resultado).toEqual({
        displayPhoneNumber: "+55 11 99999-9999",
        verifiedName: "Sakura Travel",
      });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(
        "https://api.teste.whatsapp/phone-id-teste?fields=display_phone_number,verified_name",
      );
    });

    it("propaga o erro mapeado se a chamada falhar (ex: token inválido)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        errJson(401, { error: { code: 190, message: "Invalid OAuth access token" } }),
      );

      await expect(new MetaWhatsAppAdapter().verificarCredenciais()).rejects.toThrow(
        "WhatsApp Cloud API",
      );
    });
  });
});

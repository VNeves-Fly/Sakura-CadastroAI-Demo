import { D4SignAdapter } from "@/modules/cadastro/infrastructure/adapters/d4sign.adapter";
import type { GerarContratoInput } from "@/modules/cadastro/domain/services/contrato-assinatura-service";

const originalEnv = process.env;

function setEnv(overrides: Record<string, string> = {}) {
  process.env = {
    ...originalEnv,
    D4SIGN_TOKEN_API: "token-teste",
    D4SIGN_CRYPT_KEY: "crypt-teste",
    D4SIGN_SAFE_UUID: "safe-uuid",
    D4SIGN_TEMPLATE_ID: "template-id",
    D4SIGN_API_BASE_URL: "https://api.teste.d4sign",
    ...overrides,
  };
}

function okJson(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

const input: GerarContratoInput = {
  cnpj: "19131243000197",
  razaoSocial: "Agência Teste",
  origem: "campanha-x",
  endereco: {
    logradouro: "Av Paulista",
    numero: "1000",
    complemento: "",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01310100",
  },
  signatarios: [{ nome: "Fulano de Tal", email: "fulano@teste.com", cpf: "39053344705" }],
};

describe("D4SignAdapter", () => {
  beforeEach(() => {
    setEnv();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("gera o documento a partir do template, cadastra o signatário e envia pra assinatura, nessa ordem", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    const resultado = await new D4SignAdapter().gerarEEnviar(input);

    expect(resultado).toEqual({ provedorId: "doc-uuid-123", status: "aguardando_assinatura" });
    expect(global.fetch).toHaveBeenCalledTimes(3);

    const [criarUrl, criarOpts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(criarUrl).toBe(
      "https://api.teste.d4sign/documents/safe-uuid/makedocumentbytemplateword?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(criarOpts.body)).toEqual({
      name_document: "Contrato Sakura - Agência Teste",
      templates: {
        "template-id": {
          razaosocial: "Agência Teste",
          cnpj: "19131243000197",
          cidade: "São Paulo",
          estado: "SP",
          endereco: "Av Paulista",
          n: "1000",
          complemento: "",
          bairro: "Bela Vista",
          cep: "01310100",
          indicacao: "campanha-x",
          socios: "Fulano de Tal (CPF: 39053344705)",
        },
      },
    });

    const [listaUrl, listaOpts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(listaUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/createlist?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(listaOpts.body)).toEqual({
      signers: [
        {
          email: "fulano@teste.com",
          act: "1",
          foreign: "0",
          certificadoicpbr: "0",
          assinatura_presencial: "0",
        },
      ],
    });

    const [envioUrl, envioOpts] = (global.fetch as jest.Mock).mock.calls[2];
    expect(envioUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/sendtosigner?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(envioOpts.body)).toEqual({ skip_email: "0", workflow: "0" });
  });

  it("registra o webhook no documento quando D4SIGN_WEBHOOK_URL está configurada", async () => {
    setEnv({ D4SIGN_WEBHOOK_URL: "https://meusite.com/api/webhooks/d4sign" });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter().gerarEEnviar(input);

    expect(global.fetch).toHaveBeenCalledTimes(4);
    const [webhookUrl, webhookOpts] = (global.fetch as jest.Mock).mock.calls[1];
    expect(webhookUrl).toBe(
      "https://api.teste.d4sign/documents/doc-uuid-123/webhooks?tokenAPI=token-teste&cryptKey=crypt-teste",
    );
    expect(JSON.parse(webhookOpts.body)).toEqual({
      url: "https://meusite.com/api/webhooks/d4sign",
    });
  });

  it("não registra webhook quando D4SIGN_WEBHOOK_URL não está configurada", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(okJson({ uuid: "doc-uuid-123" }))
      .mockResolvedValueOnce(okJson({}))
      .mockResolvedValueOnce(okJson({}));

    await new D4SignAdapter().gerarEEnviar(input);

    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("lança erro descritivo se alguma chamada ao D4Sign falhar", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Token inválido" }),
    });

    await expect(new D4SignAdapter().gerarEEnviar(input)).rejects.toThrow(
      "D4Sign /documents/safe-uuid/makedocumentbytemplateword respondeu 400",
    );
  });

  it.each(["D4SIGN_TOKEN_API", "D4SIGN_CRYPT_KEY", "D4SIGN_SAFE_UUID", "D4SIGN_TEMPLATE_ID"])(
    "lança erro claro se %s não está configurada",
    async (envVar) => {
      setEnv();
      delete process.env[envVar];

      await expect(new D4SignAdapter().gerarEEnviar(input)).rejects.toThrow(
        `${envVar} não configurada`,
      );
    },
  );
});

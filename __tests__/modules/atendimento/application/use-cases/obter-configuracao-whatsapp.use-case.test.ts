import { ObterConfiguracaoWhatsappUseCase } from "@/modules/atendimento/application/use-cases/obter-configuracao-whatsapp.use-case";

const originalEnv = process.env;

describe("ObterConfiguracaoWhatsappUseCase", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("reflete o que está no .env sem nunca reexpor os segredos em texto puro", () => {
    process.env = {
      ...originalEnv,
      WHATSAPP_BUSINESS_ACCOUNT_ID: "waba-123",
      WHATSAPP_PHONE_NUMBER_ID: "phone-456",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: "verify-token",
      WHATSAPP_APP_SECRET: "segredo-app",
      WHATSAPP_ACCESS_TOKEN: "token-secreto",
    };

    const resultado = new ObterConfiguracaoWhatsappUseCase().execute();

    expect(resultado).toEqual({
      appId: "",
      whatsappBusinessAccountId: "waba-123",
      phoneNumberId: "phone-456",
      numeroTelefoneExibicao: "",
      webhookVerifyToken: "verify-token",
      appSecretConfigurado: true,
      accessTokenConfigurado: true,
      conectado: false,
      salvoPor: null,
      salvoEm: null,
    });
    expect(JSON.stringify(resultado)).not.toContain("segredo-app");
    expect(JSON.stringify(resultado)).not.toContain("token-secreto");
  });

  it("marca appSecretConfigurado/accessTokenConfigurado como false quando não configurados", () => {
    process.env = { ...originalEnv };
    delete process.env.WHATSAPP_APP_SECRET;
    delete process.env.WHATSAPP_ACCESS_TOKEN;

    const resultado = new ObterConfiguracaoWhatsappUseCase().execute();

    expect(resultado.appSecretConfigurado).toBe(false);
    expect(resultado.accessTokenConfigurado).toBe(false);
    expect(resultado.conectado).toBe(false);
  });
});

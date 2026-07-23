export interface ConfiguracaoWhatsappOutput {
  appId: string;
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  numeroTelefoneExibicao: string;
  webhookVerifyToken: string;
  appSecretConfigurado: boolean;
  accessTokenConfigurado: boolean;
  conectado: boolean;
  salvoPor: string | null;
  salvoEm: string | null;
}

// .env é a fonte da verdade (decisão de produto 2026-07-23) — não existe
// tabela de configuração nem "salvarConfiguracaoWhatsapp" real ainda; essa
// use-case só reflete o que já está no ambiente, nunca re-expõe segredo em
// texto puro (appSecret/accessToken viram só um booleano "configurado").
export class ObterConfiguracaoWhatsappUseCase {
  execute(): ConfiguracaoWhatsappOutput {
    return {
      appId: "",
      whatsappBusinessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? "",
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
      numeroTelefoneExibicao: "",
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "",
      appSecretConfigurado: Boolean(process.env.WHATSAPP_APP_SECRET),
      accessTokenConfigurado: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
      // Só uma chamada de teste bem-sucedida confirma conexão de verdade
      // (ver TestarConexaoWhatsappUseCase) — nunca assumido aqui.
      conectado: false,
      salvoPor: null,
      salvoEm: null,
    };
  }
}

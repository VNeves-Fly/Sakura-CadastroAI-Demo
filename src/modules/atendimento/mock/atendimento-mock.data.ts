import type { ConfiguracaoWhatsappBusiness } from "@/modules/atendimento/types/atendimento.types";

// salvarConfiguracaoWhatsapp (atendimento-api.ts) segue fora de escopo
// (.env é a fonte da verdade — decisão de produto 2026-07-23) e continua
// mockado em memória; o resto do módulo já fala com o backend real.

// Nunca "conectado" no mock — só uma chamada de teste real confirma isso
// (ver testarConexaoWhatsapp). Segredos (App Secret, Access Token) nem
// entram aqui — só o booleano "configurado" (ver ConfiguracaoWhatsappBusiness).
export function gerarConfiguracaoWhatsappMock(): ConfiguracaoWhatsappBusiness {
  return {
    appId: "",
    whatsappBusinessAccountId: "",
    phoneNumberId: "",
    numeroTelefoneExibicao: "",
    webhookVerifyToken: "",
    appSecretConfigurado: false,
    accessTokenConfigurado: false,
    conectado: false,
    salvoPor: null,
    salvoEm: null,
  };
}

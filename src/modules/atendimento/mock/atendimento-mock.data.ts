import type {
  TemplateAprovado,
  ConfiguracaoWhatsappBusiness,
} from "@/modules/atendimento/types/atendimento.types";

// Gestão de templates e configuração do WhatsApp ainda não têm rota real
// no backend (ver atendimento-api.ts) — continuam mockadas aqui.

function horasAtras(horas: number): string {
  return new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
}

// Pool fixo pra popular o seletor de "Transferir atendimento" — em uma
// versão real isso viria da lista de analistas cadastrados (Usuários).
export const ANALISTAS_MOCK = ["Fernanda Lima", "Pedro Santos", "Juliana Costa", "Marcos Vidal"];

export function gerarTemplatesAprovadosMock(): TemplateAprovado[] {
  return [
    {
      id: "template-1",
      nome: "boas_vindas_retorno",
      conteudo:
        "Olá! Notamos que faz um tempo desde nossa última conversa. Podemos ajudar em algo?",
      categoria: "UTILITY",
      idioma: "pt_BR",
      status: "aprovado",
      motivoRejeicao: null,
      criadoEm: horasAtras(200),
    },
    {
      id: "template-2",
      nome: "status_cadastro",
      conteudo: "Olá! Passando pra te atualizar sobre o status do seu cadastro na Sakura.",
      categoria: "UTILITY",
      idioma: "pt_BR",
      status: "aprovado",
      motivoRejeicao: null,
      criadoEm: horasAtras(150),
    },
    {
      id: "template-3",
      nome: "promocao_geral",
      conteudo: "Aproveite nossas condições especiais esse mês, fale com seu analista!",
      categoria: "MARKETING",
      idioma: "pt_BR",
      status: "rejeitado",
      motivoRejeicao:
        "Texto genérico demais — a Meta exige contexto claro de opt-in do destinatário.",
      criadoEm: horasAtras(100),
    },
  ];
}

// Nunca "conectado" no mock — não existe integração real com a Meta
// ainda (ver atendimento-api.ts). Segredos (App Secret, Access Token)
// nem entram aqui — só o booleano "configurado" (ver
// ConfiguracaoWhatsappBusiness).
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

import type {
  EnviarMidiaInput,
  EnvioResultado,
  TemplateAprovadoMeta,
  TipoMidiaWhatsApp,
  WhatsAppMessagingService,
} from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

let contador = 0;

function fakeMessageId(): string {
  contador += 1;
  return `wamid.MOCK${contador}`;
}

// Usado quando WHATSAPP_ACCESS_TOKEN não está configurada — mesmo padrão
// de MockD4SignService/MockAnaliseIaService. Não fala com nenhuma API de
// verdade; deixa o fluxo do módulo testável em dev sem credenciais da
// Meta.
export class MockWhatsAppMessagingAdapter implements WhatsAppMessagingService {
  async enviarTexto(_paraNumero: string, _texto: string): Promise<EnvioResultado> {
    return { waMessageId: fakeMessageId() };
  }

  async enviarTemplate(
    _paraNumero: string,
    _templateNome: string,
    _idioma: string,
    _parametros?: string[],
  ): Promise<EnvioResultado> {
    return { waMessageId: fakeMessageId() };
  }

  async enviarMidia(
    _paraNumero: string,
    _tipo: TipoMidiaWhatsApp,
    _arquivo: EnviarMidiaInput,
  ): Promise<EnvioResultado> {
    return { waMessageId: fakeMessageId() };
  }

  async listarTemplatesAprovados(): Promise<TemplateAprovadoMeta[]> {
    return [
      {
        metaTemplateId: "mock-boas-vindas",
        nome: "boas_vindas",
        conteudo: "Olá! Recebemos seu cadastro e em breve um analista vai te atender.",
        idioma: "pt_BR",
      },
    ];
  }

  async baixarMidia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    return { buffer: Buffer.from(`mock-media-${mediaId}`), mimeType: "application/octet-stream" };
  }
}

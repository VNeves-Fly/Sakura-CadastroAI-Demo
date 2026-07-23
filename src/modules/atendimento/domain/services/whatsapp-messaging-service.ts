export interface EnviarMidiaInput {
  buffer: Buffer;
  mimeType: string;
  filename?: string;
}

export interface EnvioResultado {
  waMessageId: string;
}

export interface TemplateAprovadoMeta {
  metaTemplateId: string;
  nome: string;
  conteudo: string;
  idioma: string;
}

export type TipoMidiaWhatsApp = "audio" | "imagem" | "pdf";

// Seam da integração com a Meta WhatsApp Business Cloud API — implementada
// por MetaWhatsAppAdapter (real) ou MockWhatsAppMessagingAdapter (sem
// WHATSAPP_ACCESS_TOKEN configurada), selecionada no composition root
// (atendimento.controller.ts).
export interface WhatsAppMessagingService {
  enviarTexto(paraNumero: string, texto: string): Promise<EnvioResultado>;

  enviarTemplate(
    paraNumero: string,
    templateNome: string,
    idioma: string,
    parametros?: string[],
  ): Promise<EnvioResultado>;

  enviarMidia(
    paraNumero: string,
    tipo: TipoMidiaWhatsApp,
    arquivo: EnviarMidiaInput,
  ): Promise<EnvioResultado>;

  listarTemplatesAprovados(): Promise<TemplateAprovadoMeta[]>;

  // A URL de download da Meta expira rápido — chamar de forma síncrona,
  // nunca adiar pra depois do handler do webhook responder.
  baixarMidia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }>;
}

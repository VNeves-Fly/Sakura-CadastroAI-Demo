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

// Espelha o que a Meta devolve pra qualquer template, sem filtrar por
// status — usado pela gestão de templates (Messenger), diferente de
// TemplateAprovadoMeta (só aprovados, usado no sync pra envio).
export interface TemplateMetaCompleto {
  metaTemplateId: string;
  nome: string;
  conteudo: string;
  idioma: string;
  categoria: string;
  status: string; // valor cru da Meta: APPROVED | PENDING | REJECTED | PAUSED
  motivoRejeicao: string | null;
}

export interface CriarTemplateMetaInput {
  nome: string;
  categoria: string;
  idioma: string;
  conteudo: string;
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

  // Todos os templates da conta, qualquer status, com motivo de rejeição
  // quando houver — usado pelo sync pra alimentar a gestão de templates.
  listarTodosTemplates(): Promise<TemplateMetaCompleto[]>;

  // Submete um template novo pra aprovação da Meta (Business Management
  // API) — POST /{waba-id}/message_templates.
  criarTemplate(input: CriarTemplateMetaInput): Promise<{ metaTemplateId: string }>;

  // Edita um template existente (ex.: reenvio depois de rejeitado) — Meta
  // reavalia do zero e o status volta pra PENDING.
  editarTemplate(metaTemplateId: string, conteudo: string): Promise<void>;

  // A URL de download da Meta expira rápido — chamar de forma síncrona,
  // nunca adiar pra depois do handler do webhook responder.
  baixarMidia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }>;

  // "Testar conexão" da tela Messenger — GET leve no próprio número, só
  // pra confirmar que as credenciais no .env realmente falam com a Meta.
  verificarCredenciais(): Promise<{ displayPhoneNumber: string; verifiedName: string }>;
}

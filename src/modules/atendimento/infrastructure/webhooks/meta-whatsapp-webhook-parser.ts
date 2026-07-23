import type { TipoMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";
import type { StatusEntregaMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

export interface MensagemRecebidaDTO {
  waMessageId: string;
  deWaId: string;
  nomePerfil: string | null;
  tipo: TipoMensagemEntity | "nao_suportado";
  conteudoTexto: string | null;
  midia: { mediaId: string; mimeType: string } | null;
  duracaoSegundos?: number;
}

export interface StatusAtualizadoDTO {
  waMessageId: string;
  status: StatusEntregaMensagemEntity;
}

export interface WebhookWhatsAppParseado {
  mensagensRecebidas: MensagemRecebidaDTO[];
  statusAtualizados: StatusAtualizadoDTO[];
}

const STATUS_META_TO_ENTITY: Record<string, StatusEntregaMensagemEntity> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
};

interface MetaMensagem {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string };
}

interface MetaContato {
  wa_id: string;
  profile?: { name?: string };
}

interface MetaStatus {
  id: string;
  status: string;
}

interface MetaWebhookValue {
  messaging_product?: string;
  contacts?: MetaContato[];
  messages?: MetaMensagem[];
  statuses?: MetaStatus[];
}

interface MetaWebhookPayload {
  entry?: {
    changes?: {
      field?: string;
      value?: MetaWebhookValue;
    }[];
  }[];
}

function mapMensagem(mensagem: MetaMensagem, contatos: MetaContato[]): MensagemRecebidaDTO {
  const contato = contatos.find((item) => item.wa_id === mensagem.from);
  const nomePerfil = contato?.profile?.name ?? null;

  if (mensagem.type === "text") {
    return {
      waMessageId: mensagem.id,
      deWaId: mensagem.from,
      nomePerfil,
      tipo: "texto",
      conteudoTexto: mensagem.text?.body ?? "",
      midia: null,
    };
  }
  if (mensagem.type === "audio" && mensagem.audio) {
    return {
      waMessageId: mensagem.id,
      deWaId: mensagem.from,
      nomePerfil,
      tipo: "audio",
      conteudoTexto: null,
      midia: { mediaId: mensagem.audio.id, mimeType: mensagem.audio.mime_type },
    };
  }
  if (mensagem.type === "image" && mensagem.image) {
    return {
      waMessageId: mensagem.id,
      deWaId: mensagem.from,
      nomePerfil,
      tipo: "imagem",
      conteudoTexto: null,
      midia: { mediaId: mensagem.image.id, mimeType: mensagem.image.mime_type },
    };
  }
  if (mensagem.type === "document" && mensagem.document) {
    return {
      waMessageId: mensagem.id,
      deWaId: mensagem.from,
      nomePerfil,
      tipo: "pdf",
      conteudoTexto: null,
      midia: { mediaId: mensagem.document.id, mimeType: mensagem.document.mime_type },
    };
  }

  // sticker/video/location/contacts/button/interactive/reaction/etc. —
  // fora do que TipoMensagem do front suporta; sinalizado, não descartado
  // silenciosamente (o consumidor decide ignorar/logar).
  return {
    waMessageId: mensagem.id,
    deWaId: mensagem.from,
    nomePerfil,
    tipo: "nao_suportado",
    conteudoTexto: null,
    midia: null,
  };
}

// Função pura — sem I/O, sem side effects. Percorre entry[].changes[]
// ignorando qualquer change cujo messaging_product não seja "whatsapp"
// (a Meta multiplexa outros produtos no mesmo endpoint de webhook por app).
export function parseWebhookWhatsApp(payload: unknown): WebhookWhatsAppParseado {
  const mensagensRecebidas: MensagemRecebidaDTO[] = [];
  const statusAtualizados: StatusAtualizadoDTO[] = [];

  const entries = (payload as MetaWebhookPayload)?.entry ?? [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value || value.messaging_product !== "whatsapp") continue;

      const contatos = value.contacts ?? [];
      for (const mensagem of value.messages ?? []) {
        mensagensRecebidas.push(mapMensagem(mensagem, contatos));
      }

      for (const status of value.statuses ?? []) {
        const statusEntity = STATUS_META_TO_ENTITY[status.status];
        if (!statusEntity) continue;
        statusAtualizados.push({ waMessageId: status.id, status: statusEntity });
      }
    }
  }

  return { mensagensRecebidas, statusAtualizados };
}

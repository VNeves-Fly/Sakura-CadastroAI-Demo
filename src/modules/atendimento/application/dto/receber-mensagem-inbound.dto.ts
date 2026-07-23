import type { TipoMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

// Contrato de saída do parser do webhook da Meta
// (infrastructure/webhooks/meta-whatsapp-webhook-parser.ts) — o que entra
// no ReceberMensagemWhatsAppUseCase, já normalizado.
export interface ReceberMensagemInboundInput {
  telefoneWhatsapp: string; // wa_id — E.164 dígitos, sem "+"
  nomePerfil: string | null;
  tipo: TipoMensagemEntity;
  conteudo: string; // texto puro, ou caption/nome de arquivo p/ mídia
  waMessageId: string;
  mediaId?: string; // presente quando tipo != "texto"
  duracaoSegundos?: number;
}

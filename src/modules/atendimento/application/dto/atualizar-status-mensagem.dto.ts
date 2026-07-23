import type { StatusEntregaMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

export interface AtualizarStatusMensagemInput {
  waMessageId: string;
  status: StatusEntregaMensagemEntity;
}

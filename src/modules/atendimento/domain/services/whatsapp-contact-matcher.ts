import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface ContatoEncontrado {
  agenciaId: string;
  representanteLegalId: string | null;
  membroNome: string;
  membroPapel: PapelMembroEntity;
}

// Resolve um telefoneWhatsapp (wa_id) pra um contato conhecido — sócio,
// representante legal ou telefone comercial de alguma agência cadastrada.
// Retorna null quando nenhuma agência bate (a conversa então é criada no
// bucket "não identificado" — ver ReceberMensagemWhatsAppUseCase).
export interface WhatsAppContactMatcher {
  match(telefoneWhatsapp: string): Promise<ContatoEncontrado | null>;
}

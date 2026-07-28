import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface IniciarConversaInput {
  agenciaId: string;
  // Sempre resolvido a partir da sessão do analista na rota — usado pra
  // garantir que ele já assumiu o atendimento da agência antes de iniciar
  // conversa (ver garantir-atendimento-assumido.ts).
  analistaId: string;
  telefoneWhatsapp: string;
  representanteLegalId: string | null;
  membroNome: string | null;
  membroPapel: PapelMembroEntity;
}

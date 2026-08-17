import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface VincularConversaAgenciaInput {
  conversaId: string;
  agenciaId: string;
  representanteLegalId: string | null;
  membroNome: string;
  membroPapel: PapelMembroEntity;
}

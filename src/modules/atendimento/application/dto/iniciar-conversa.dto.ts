import type { PapelMembroEntity } from "@/modules/atendimento/domain/entities/conversa.entity";

export interface IniciarConversaInput {
  agenciaId: string;
  telefoneWhatsapp: string;
  representanteLegalId: string | null;
  membroNome: string | null;
  membroPapel: PapelMembroEntity;
}

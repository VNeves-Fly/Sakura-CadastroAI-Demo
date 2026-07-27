import type {
  ConversaEntity,
  PapelMembroEntity,
  TipoContatoConversaEntity,
} from "@/modules/atendimento/domain/entities/conversa.entity";

export interface CriarConversaData {
  telefoneWhatsapp: string;
  tipoContato: TipoContatoConversaEntity;
  agenciaId: string | null;
  representanteLegalId: string | null;
  membroNome: string | null;
  membroPapel: PapelMembroEntity;
  membroTelefone: string;
}

export interface ConversaRepository {
  findAll(): Promise<ConversaEntity[]>;
  findById(id: string): Promise<ConversaEntity | null>;
  findByTelefoneWhatsapp(telefoneWhatsapp: string): Promise<ConversaEntity | null>;
  findAllByAgenciaId(agenciaId: string): Promise<ConversaEntity[]>;
  create(data: CriarConversaData): Promise<ConversaEntity>;
  touchLastMessage(id: string, quando: Date): Promise<void>;
}

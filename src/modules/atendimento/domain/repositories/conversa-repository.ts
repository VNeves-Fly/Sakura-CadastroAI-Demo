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

export interface VincularConversaAgenciaData {
  agenciaId: string;
  representanteLegalId: string | null;
  membroNome: string;
  membroPapel: PapelMembroEntity;
}

export interface ConversaRepository {
  findAll(): Promise<ConversaEntity[]>;
  findById(id: string): Promise<ConversaEntity | null>;
  findByTelefoneWhatsapp(telefoneWhatsapp: string): Promise<ConversaEntity | null>;
  findAllByAgenciaId(agenciaId: string): Promise<ConversaEntity[]>;
  create(data: CriarConversaData): Promise<ConversaEntity>;
  touchLastMessage(id: string, quando: Date): Promise<void>;
  // Liga uma conversa "não identificada" a uma agência escolhida manualmente
  // pelo analista — claim atômico (só efetiva se `agenciaId` ainda for null
  // na hora do UPDATE) pra cobrir dois analistas tentando vincular a mesma
  // conversa ao mesmo tempo. Lança ConflictError se ela já não for mais
  // "não identificada".
  vincularAgencia(conversaId: string, data: VincularConversaAgenciaData): Promise<ConversaEntity>;
}

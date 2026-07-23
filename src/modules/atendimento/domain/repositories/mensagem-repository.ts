import type {
  AutorMensagemEntity,
  MensagemEntity,
  StatusEntregaMensagemEntity,
  TipoMensagemEntity,
} from "@/modules/atendimento/domain/entities/mensagem.entity";

export interface CriarMensagemData {
  conversaId: string;
  autor: AutorMensagemEntity;
  analistaId: string | null;
  tipo: TipoMensagemEntity;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivoBytes?: number;
  midiaId?: string;
  waMessageId?: string;
  lido?: boolean;
}

// Metadados do arquivo já salvo via FileStorage — espelha SavedFile
// (path/bucket) mais os campos de exibição/checagem de Documento.
export interface CriarMidiaData {
  fileName?: string;
  mimeType?: string;
  gcsPath: string;
  gcsBucket: string | null;
  gcsSize?: number;
  gcsMd5?: string;
}

export interface MidiaArmazenada {
  gcsPath: string;
  gcsBucket: string | null;
  mimeType: string | null;
  fileName: string | null;
}

export interface MensagemRepository {
  create(data: CriarMensagemData): Promise<MensagemEntity>;
  criarMidia(data: CriarMidiaData): Promise<{ id: string }>;
  findMidiaById(midiaId: string): Promise<MidiaArmazenada | null>;
  marcarClienteComoLidas(conversaId: string): Promise<void>;
  // Chave de idempotência do webhook — Meta redelivera eventos em retry.
  findByWaMessageId(waMessageId: string): Promise<MensagemEntity | null>;
  atualizarStatusPorWaMessageId(
    waMessageId: string,
    status: StatusEntregaMensagemEntity,
  ): Promise<void>;
}

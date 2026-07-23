import type { TipoMensagemEntity } from "@/modules/atendimento/domain/entities/mensagem.entity";

export interface EnviarMensagemInput {
  conversaId: string;
  // Sempre resolvido a partir da sessão do analista na rota — nunca de um
  // campo de body vindo do cliente.
  analistaId: string;
  tipo: TipoMensagemEntity;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivo?: string;
}

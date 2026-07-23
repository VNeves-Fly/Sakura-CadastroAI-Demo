export type TipoMensagemEntity = "texto" | "audio" | "imagem" | "pdf";
export type AutorMensagemEntity = "cliente" | "analista";
export type StatusEntregaMensagemEntity = "sent" | "delivered" | "read" | "failed";

// Já no formato que o front espera (Mensagem em atendimento.types.ts) —
// os repositórios Prisma convertem os enums UPPER_CASE do banco pra estes
// literais minúsculos, então as use-cases não lidam com o formato do
// banco em nenhum momento.
export interface MensagemEntity {
  id: string;
  conversaId: string;
  autor: AutorMensagemEntity;
  analistaNome?: string;
  tipo: TipoMensagemEntity;
  conteudo: string;
  duracaoSegundos?: number;
  tamanhoArquivo?: string;
  lido: boolean;
  createdAt: string;
}

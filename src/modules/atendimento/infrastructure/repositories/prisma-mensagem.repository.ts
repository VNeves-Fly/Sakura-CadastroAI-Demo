import {
  AutorMensagem,
  Prisma,
  type PrismaClient,
  StatusEntregaMensagem,
  TipoMensagemWhatsApp,
} from "@prisma/client";
import type {
  CriarMensagemData,
  CriarMidiaData,
  MensagemRepository,
  MidiaArmazenada,
} from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type {
  AutorMensagemEntity,
  MensagemEntity,
  StatusEntregaMensagemEntity,
  TipoMensagemEntity,
} from "@/modules/atendimento/domain/entities/mensagem.entity";

const TIPO_TO_ENTITY: Record<TipoMensagemWhatsApp, TipoMensagemEntity> = {
  TEXTO: "texto",
  AUDIO: "audio",
  IMAGEM: "imagem",
  PDF: "pdf",
};
const TIPO_TO_PRISMA: Record<TipoMensagemEntity, TipoMensagemWhatsApp> = {
  texto: TipoMensagemWhatsApp.TEXTO,
  audio: TipoMensagemWhatsApp.AUDIO,
  imagem: TipoMensagemWhatsApp.IMAGEM,
  pdf: TipoMensagemWhatsApp.PDF,
};
const AUTOR_TO_ENTITY: Record<AutorMensagem, AutorMensagemEntity> = {
  CLIENTE: "cliente",
  ANALISTA: "analista",
};
const AUTOR_TO_PRISMA: Record<AutorMensagemEntity, AutorMensagem> = {
  cliente: AutorMensagem.CLIENTE,
  analista: AutorMensagem.ANALISTA,
};
const STATUS_ENTIDADE_TO_PRISMA: Record<StatusEntregaMensagemEntity, StatusEntregaMensagem> = {
  sent: StatusEntregaMensagem.ENVIADO,
  delivered: StatusEntregaMensagem.ENTREGUE,
  read: StatusEntregaMensagem.LIDO,
  failed: StatusEntregaMensagem.FALHOU,
};

const MENSAGEM_INCLUDE = {
  analista: { select: { name: true } },
  midia: true,
} satisfies Prisma.MensagemInclude;

type MensagemComRelacoes = Prisma.MensagemGetPayload<{ include: typeof MENSAGEM_INCLUDE }>;

function formatarTamanhoArquivo(bytes: number | null | undefined): string | undefined {
  if (!bytes) return undefined;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Reaproveitado por PrismaConversaRepository (mensagens vêm embutidas na
// listagem de conversas) — única fonte da conversão Prisma → domínio.
export function mensagemToDomain(record: MensagemComRelacoes): MensagemEntity {
  return {
    id: record.id,
    conversaId: record.conversaId,
    autor: AUTOR_TO_ENTITY[record.autor],
    analistaNome: record.analista?.name,
    tipo: TIPO_TO_ENTITY[record.tipo],
    conteudo: record.conteudo,
    duracaoSegundos: record.duracaoSegundos ?? undefined,
    tamanhoArquivo: formatarTamanhoArquivo(record.midia?.gcsSize ?? record.tamanhoArquivoBytes),
    lido: record.lido,
    createdAt: record.createdAt.toISOString(),
  };
}

export class PrismaMensagemRepository implements MensagemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CriarMensagemData): Promise<MensagemEntity> {
    const record = await this.prisma.mensagem.create({
      data: {
        conversaId: data.conversaId,
        autor: AUTOR_TO_PRISMA[data.autor],
        analistaId: data.analistaId,
        tipo: TIPO_TO_PRISMA[data.tipo],
        conteudo: data.conteudo,
        duracaoSegundos: data.duracaoSegundos,
        tamanhoArquivoBytes: data.tamanhoArquivoBytes,
        midiaId: data.midiaId,
        waMessageId: data.waMessageId,
        lido: data.lido ?? false,
      },
      include: MENSAGEM_INCLUDE,
    });
    return mensagemToDomain(record);
  }

  async criarMidia(data: CriarMidiaData): Promise<{ id: string }> {
    const midia = await this.prisma.mensagemMidia.create({
      data: {
        fileName: data.fileName,
        mimeType: data.mimeType,
        gcsPath: data.gcsPath,
        gcsBucket: data.gcsBucket,
        gcsSize: data.gcsSize,
        gcsMd5: data.gcsMd5,
      },
    });
    return { id: midia.id };
  }

  async findMidiaById(midiaId: string): Promise<MidiaArmazenada | null> {
    const midia = await this.prisma.mensagemMidia.findUnique({ where: { id: midiaId } });
    if (!midia) return null;
    return {
      gcsPath: midia.gcsPath,
      gcsBucket: midia.gcsBucket,
      mimeType: midia.mimeType,
      fileName: midia.fileName,
    };
  }

  async marcarClienteComoLidas(conversaId: string): Promise<void> {
    await this.prisma.mensagem.updateMany({
      where: { conversaId, autor: AutorMensagem.CLIENTE },
      data: { lido: true },
    });
  }

  async findByWaMessageId(waMessageId: string): Promise<MensagemEntity | null> {
    const record = await this.prisma.mensagem.findUnique({
      where: { waMessageId },
      include: MENSAGEM_INCLUDE,
    });
    return record ? mensagemToDomain(record) : null;
  }

  async atualizarStatusPorWaMessageId(
    waMessageId: string,
    status: StatusEntregaMensagemEntity,
  ): Promise<void> {
    await this.prisma.mensagem.updateMany({
      where: { waMessageId },
      data: { status: STATUS_ENTIDADE_TO_PRISMA[status] },
    });
  }
}

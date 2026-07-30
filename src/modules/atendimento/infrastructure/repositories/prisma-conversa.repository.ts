import {
  PapelMembroConversa,
  Prisma,
  type PrismaClient,
  TipoContatoConversa,
} from "@prisma/client";
import type {
  ConversaRepository,
  CriarConversaData,
} from "@/modules/atendimento/domain/repositories/conversa-repository";
import type {
  ConversaEntity,
  PapelMembroEntity,
  TipoContatoConversaEntity,
} from "@/modules/atendimento/domain/entities/conversa.entity";
import { mensagemToDomain } from "@/modules/atendimento/infrastructure/repositories/prisma-mensagem.repository";

const TIPO_CONTATO_TO_ENTITY: Record<TipoContatoConversa, TipoContatoConversaEntity> = {
  AGENCIA: "agencia",
  NAO_IDENTIFICADO: "nao_identificado",
};
const TIPO_CONTATO_TO_PRISMA: Record<TipoContatoConversaEntity, TipoContatoConversa> = {
  agencia: TipoContatoConversa.AGENCIA,
  nao_identificado: TipoContatoConversa.NAO_IDENTIFICADO,
};
const PAPEL_MEMBRO_TO_ENTITY: Record<PapelMembroConversa, PapelMembroEntity> = {
  SOCIO: "socio",
  REPRESENTANTE_LEGAL: "representante_legal",
  COMERCIAL: "comercial",
  OUTRO: "outro",
};
const PAPEL_MEMBRO_TO_PRISMA: Record<PapelMembroEntity, PapelMembroConversa> = {
  socio: PapelMembroConversa.SOCIO,
  representante_legal: PapelMembroConversa.REPRESENTANTE_LEGAL,
  comercial: PapelMembroConversa.COMERCIAL,
  outro: PapelMembroConversa.OUTRO,
};

const CONVERSA_INCLUDE = {
  agencia: {
    select: {
      razaoSocial: true,
      cnpj: true,
      // Atendimento é sempre da AGÊNCIA, não da conversa — duas conversas
      // da mesma agência compartilham o mesmo atendimentoAtual/histórico
      // (ver AtendimentoAgencia). Conversa "não identificada" (agencia
      // null) nunca tem atendimento.
      atendimentosAgencia: {
        orderBy: { assumidoEm: "desc" },
        select: {
          analistaId: true,
          assumidoEm: true,
          liberadoEm: true,
          analista: { select: { name: true } },
        },
      },
    },
  },
  mensagens: {
    orderBy: { createdAt: "asc" },
    include: { analista: { select: { name: true } }, midia: true },
  },
} satisfies Prisma.ConversaInclude;

type ConversaComRelacoes = Prisma.ConversaGetPayload<{ include: typeof CONVERSA_INCLUDE }>;

function toDomain(record: ConversaComRelacoes): ConversaEntity {
  const atendimentosAgencia = record.agencia?.atendimentosAgencia ?? [];
  const atendimentoAtual = atendimentosAgencia.find((item) => item.liberadoEm === null) ?? null;

  return {
    id: record.id,
    tipoContato: TIPO_CONTATO_TO_ENTITY[record.tipoContato],
    agenciaId: record.agenciaId,
    agenciaNome: record.agencia?.razaoSocial ?? "Contato não identificado",
    agenciaCnpj: record.agencia?.cnpj ?? "",
    membro: {
      id: record.id,
      nome: record.membroNome ?? "Contato não identificado",
      papel: PAPEL_MEMBRO_TO_ENTITY[record.membroPapel],
      telefone: record.membroTelefone,
    },
    mensagens: record.mensagens.map(mensagemToDomain),
    atendimentoAtual: atendimentoAtual
      ? {
          analistaId: atendimentoAtual.analistaId,
          analistaNome: atendimentoAtual.analista.name,
          assumidoEm: atendimentoAtual.assumidoEm.toISOString(),
          liberadoEm: null,
        }
      : null,
    historicoAtendimento: atendimentosAgencia.map((item) => ({
      analistaId: item.analistaId,
      analistaNome: item.analista.name,
      assumidoEm: item.assumidoEm.toISOString(),
      liberadoEm: item.liberadoEm?.toISOString() ?? null,
    })),
    // Placeholder — sobrescrito pela use-case via ResumoFichaClienteRepository
    // (esta camada não tem acesso a esses dados sem um agenciaId concreto).
    resumoFicha: {
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      documentosParaRevisar: [],
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    lastMessageAt: record.lastMessageAt?.toISOString() ?? null,
  };
}

export class PrismaConversaRepository implements ConversaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<ConversaEntity[]> {
    const records = await this.prisma.conversa.findMany({
      include: CONVERSA_INCLUDE,
      orderBy: { lastMessageAt: "desc" },
    });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<ConversaEntity | null> {
    const record = await this.prisma.conversa.findUnique({
      where: { id },
      include: CONVERSA_INCLUDE,
    });
    return record ? toDomain(record) : null;
  }

  async findByTelefoneWhatsapp(telefoneWhatsapp: string): Promise<ConversaEntity | null> {
    const record = await this.prisma.conversa.findUnique({
      where: { telefoneWhatsapp },
      include: CONVERSA_INCLUDE,
    });
    return record ? toDomain(record) : null;
  }

  async findAllByAgenciaId(agenciaId: string): Promise<ConversaEntity[]> {
    const records = await this.prisma.conversa.findMany({
      where: { agenciaId },
      include: CONVERSA_INCLUDE,
    });
    return records.map(toDomain);
  }

  async create(data: CriarConversaData): Promise<ConversaEntity> {
    const record = await this.prisma.conversa.create({
      data: {
        telefoneWhatsapp: data.telefoneWhatsapp,
        tipoContato: TIPO_CONTATO_TO_PRISMA[data.tipoContato],
        agenciaId: data.agenciaId,
        representanteLegalId: data.representanteLegalId,
        membroNome: data.membroNome,
        membroPapel: PAPEL_MEMBRO_TO_PRISMA[data.membroPapel],
        membroTelefone: data.membroTelefone,
      },
      include: CONVERSA_INCLUDE,
    });
    return toDomain(record);
  }

  async touchLastMessage(id: string, quando: Date): Promise<void> {
    await this.prisma.conversa.update({
      where: { id },
      data: { lastMessageAt: quando },
    });
  }
}

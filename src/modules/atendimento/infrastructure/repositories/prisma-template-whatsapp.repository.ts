import { StatusTemplateWhatsApp, type PrismaClient } from "@prisma/client";
import type {
  AtualizarTemplateMetadataData,
  CriarTemplateLocalData,
  TemplateWhatsAppRepository,
  TemplateWhatsAppUpsertData,
} from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type {
  CategoriaTemplateEntity,
  StatusTemplateEntity,
  TemplateAprovadoEntity,
} from "@/modules/atendimento/domain/entities/template-whatsapp.entity";

const STATUS_TO_ENTITY: Record<StatusTemplateWhatsApp, StatusTemplateEntity> = {
  APPROVED: "aprovado",
  PENDING: "pendente_aprovacao",
  // PAUSED não tem equivalente no front (só aprovado/pendente/rejeitado)
  // — tratado como rejeitado pra fins de exibição, já que não pode ser
  // usado pra enviar mensagem de qualquer forma.
  PAUSED: "rejeitado",
  REJECTED: "rejeitado",
};

// Meta manda o status em maiúsculas cru (APPROVED/PENDING/REJECTED/
// PAUSED) — qualquer valor não reconhecido cai em PENDING em vez de
// quebrar o sync.
function statusMetaParaPrisma(statusMeta: string): StatusTemplateWhatsApp {
  const normalizado = statusMeta.toUpperCase();
  if (normalizado in StatusTemplateWhatsApp) {
    return StatusTemplateWhatsApp[normalizado as keyof typeof StatusTemplateWhatsApp];
  }
  return StatusTemplateWhatsApp.PENDING;
}

const CATEGORIA_DEFAULT: CategoriaTemplateEntity = "UTILITY";

function categoriaEntity(categoria: string | null): CategoriaTemplateEntity {
  return categoria === "MARKETING" || categoria === "UTILITY" || categoria === "AUTHENTICATION"
    ? categoria
    : CATEGORIA_DEFAULT;
}

function toDomain(record: {
  id: string;
  nome: string;
  titulo: string | null;
  conteudo: string;
  idioma: string;
  categoria: string | null;
  status: StatusTemplateWhatsApp;
  ativo: boolean;
  motivoRejeicao: string | null;
  sincronizadoEm: Date;
}): TemplateAprovadoEntity {
  return {
    id: record.id,
    nome: record.nome,
    titulo: record.titulo,
    conteudo: record.conteudo,
    categoria: categoriaEntity(record.categoria),
    idioma: record.idioma,
    status: STATUS_TO_ENTITY[record.status],
    ativo: record.ativo,
    motivoRejeicao: record.motivoRejeicao,
    criadoEm: record.sincronizadoEm.toISOString(),
  };
}

export class PrismaTemplateWhatsAppRepository implements TemplateWhatsAppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllAprovados(): Promise<TemplateAprovadoEntity[]> {
    // Usado pelo picker de envio (ThreadConversa) — `ativo: false` some
    // daqui mesmo que a Meta ainda considere o template aprovado.
    const records = await this.prisma.templateWhatsApp.findMany({
      where: { status: StatusTemplateWhatsApp.APPROVED, ativo: true },
      orderBy: { nome: "asc" },
    });
    return records.map(toDomain);
  }

  async findAll(): Promise<TemplateAprovadoEntity[]> {
    const records = await this.prisma.templateWhatsApp.findMany({
      orderBy: { sincronizadoEm: "desc" },
    });
    return records.map(toDomain);
  }

  async findById(id: string): Promise<TemplateAprovadoEntity | null> {
    const record = await this.prisma.templateWhatsApp.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async obterMetaTemplateId(id: string): Promise<string | null> {
    const record = await this.prisma.templateWhatsApp.findUnique({
      where: { id },
      select: { metaTemplateId: true },
    });
    return record?.metaTemplateId ?? null;
  }

  async criarLocal(data: CriarTemplateLocalData): Promise<TemplateAprovadoEntity> {
    const record = await this.prisma.templateWhatsApp.create({
      data: {
        metaTemplateId: data.metaTemplateId,
        nome: data.nome,
        idioma: data.idioma,
        conteudo: data.conteudo,
        categoria: data.categoria,
        // Toda submissão nova entra em revisão — nunca aprovado na hora.
        status: StatusTemplateWhatsApp.PENDING,
      },
    });
    return toDomain(record);
  }

  async atualizarAposReenvio(id: string, novoConteudo: string): Promise<TemplateAprovadoEntity> {
    const record = await this.prisma.templateWhatsApp.update({
      where: { id },
      data: {
        conteudo: novoConteudo,
        status: StatusTemplateWhatsApp.PENDING,
        motivoRejeicao: null,
        sincronizadoEm: new Date(),
      },
    });
    return toDomain(record);
  }

  async atualizarMetadata(
    id: string,
    data: AtualizarTemplateMetadataData,
  ): Promise<TemplateAprovadoEntity> {
    const record = await this.prisma.templateWhatsApp.update({
      where: { id },
      data: {
        ...(data.titulo !== undefined ? { titulo: data.titulo } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      },
    });
    return toDomain(record);
  }

  async upsertPorMetaTemplateId(data: TemplateWhatsAppUpsertData): Promise<void> {
    const status = statusMetaParaPrisma(data.status);
    await this.prisma.templateWhatsApp.upsert({
      where: { metaTemplateId: data.metaTemplateId },
      create: {
        metaTemplateId: data.metaTemplateId,
        nome: data.nome,
        idioma: data.idioma,
        conteudo: data.conteudo,
        categoria: data.categoria,
        status,
        motivoRejeicao: data.motivoRejeicao,
      },
      update: {
        nome: data.nome,
        idioma: data.idioma,
        conteudo: data.conteudo,
        categoria: data.categoria,
        status,
        motivoRejeicao: data.motivoRejeicao,
        sincronizadoEm: new Date(),
      },
    });
  }
}

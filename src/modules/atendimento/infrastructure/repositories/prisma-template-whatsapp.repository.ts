import { StatusTemplateWhatsApp, type PrismaClient } from "@prisma/client";
import type {
  TemplateWhatsAppRepository,
  TemplateWhatsAppUpsertData,
} from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";

export class PrismaTemplateWhatsAppRepository implements TemplateWhatsAppRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllAprovados(): Promise<TemplateAprovadoEntity[]> {
    const records = await this.prisma.templateWhatsApp.findMany({
      where: { status: StatusTemplateWhatsApp.APPROVED },
      orderBy: { nome: "asc" },
    });
    return records.map((record) => ({
      id: record.id,
      nome: record.nome,
      conteudo: record.conteudo,
      idioma: record.idioma,
    }));
  }

  async upsertPorMetaTemplateId(data: TemplateWhatsAppUpsertData): Promise<void> {
    await this.prisma.templateWhatsApp.upsert({
      where: { metaTemplateId: data.metaTemplateId },
      create: {
        metaTemplateId: data.metaTemplateId,
        nome: data.nome,
        idioma: data.idioma,
        conteudo: data.conteudo,
        categoria: data.categoria,
        status: StatusTemplateWhatsApp.APPROVED,
      },
      update: {
        nome: data.nome,
        idioma: data.idioma,
        conteudo: data.conteudo,
        categoria: data.categoria,
        status: StatusTemplateWhatsApp.APPROVED,
        sincronizadoEm: new Date(),
      },
    });
  }
}

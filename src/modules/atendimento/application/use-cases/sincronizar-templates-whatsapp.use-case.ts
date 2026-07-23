import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

// Aciona um upsert local do que está aprovado na Meta agora — chamado
// manualmente (rota /api/atendimento/templates/sincronizar) sempre que um
// template novo for aprovado no Business Manager, já que a Meta não avisa
// a gente disso via webhook.
export class SincronizarTemplatesWhatsAppUseCase {
  constructor(
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
    private readonly templateWhatsAppRepository: TemplateWhatsAppRepository,
  ) {}

  async execute(): Promise<number> {
    const templates = await this.whatsAppMessagingService.listarTemplatesAprovados();

    for (const template of templates) {
      await this.templateWhatsAppRepository.upsertPorMetaTemplateId({
        metaTemplateId: template.metaTemplateId,
        nome: template.nome,
        idioma: template.idioma,
        conteudo: template.conteudo,
      });
    }

    return templates.length;
  }
}

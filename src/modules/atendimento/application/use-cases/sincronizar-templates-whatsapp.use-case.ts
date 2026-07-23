import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

// Aciona um upsert local do que existe na Meta agora (qualquer status —
// aprovado, pendente ou rejeitado, com motivo) — chamado manualmente
// (rota /api/atendimento/templates/sincronizar) já que a Meta não avisa a
// gente de mudança de status via webhook.
export class SincronizarTemplatesWhatsAppUseCase {
  constructor(
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
    private readonly templateWhatsAppRepository: TemplateWhatsAppRepository,
  ) {}

  async execute(): Promise<number> {
    const templates = await this.whatsAppMessagingService.listarTodosTemplates();

    for (const template of templates) {
      await this.templateWhatsAppRepository.upsertPorMetaTemplateId({
        metaTemplateId: template.metaTemplateId,
        nome: template.nome,
        idioma: template.idioma,
        conteudo: template.conteudo,
        categoria: template.categoria,
        status: template.status,
        motivoRejeicao: template.motivoRejeicao,
      });
    }

    return templates.length;
  }
}

import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

// Reenviar só faz sentido pra um template rejeitado — Meta não permite
// ressubmeter o mesmo conteúdo que já foi recusado, então isso sempre
// exige editar antes (o `editarTemplate` da Meta reseta pra pendente de
// revisão do zero).
export class ReenviarTemplateUseCase {
  constructor(
    private readonly templateWhatsAppRepository: TemplateWhatsAppRepository,
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
  ) {}

  async execute(id: string, novoConteudo: string): Promise<TemplateAprovadoEntity> {
    const template = await this.templateWhatsAppRepository.findById(id);
    if (!template) throw new NotFoundError("Template");
    if (template.status !== "rejeitado") {
      throw new ConflictError("Só é possível reenviar um template rejeitado.");
    }

    const metaTemplateId = await this.templateWhatsAppRepository.obterMetaTemplateId(id);
    if (!metaTemplateId) throw new NotFoundError("Template");

    await this.whatsAppMessagingService.editarTemplate(metaTemplateId, novoConteudo);

    return this.templateWhatsAppRepository.atualizarAposReenvio(id, novoConteudo);
  }
}

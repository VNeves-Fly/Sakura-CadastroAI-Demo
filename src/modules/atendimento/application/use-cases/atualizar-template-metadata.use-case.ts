import { NotFoundError } from "@/modules/shared/domain/errors";
import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { AtualizarTemplateMetadataInput } from "@/modules/atendimento/application/dto/atualizar-template-metadata.dto";

// Título e ativo são metadata só nossa — nunca refletida na Meta, por
// isso não passa pelo whatsAppMessagingService (diferente de
// ReenviarTemplateUseCase, que edita o conteúdo lá).
export class AtualizarTemplateMetadataUseCase {
  constructor(private readonly templateWhatsAppRepository: TemplateWhatsAppRepository) {}

  async execute(
    id: string,
    input: AtualizarTemplateMetadataInput,
  ): Promise<TemplateAprovadoEntity> {
    const existente = await this.templateWhatsAppRepository.findById(id);
    if (!existente) throw new NotFoundError("Template");

    return this.templateWhatsAppRepository.atualizarMetadata(id, input);
  }
}

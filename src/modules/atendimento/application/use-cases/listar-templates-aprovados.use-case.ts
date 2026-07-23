import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";

export class ListarTemplatesAprovadosUseCase {
  constructor(private readonly templateWhatsAppRepository: TemplateWhatsAppRepository) {}

  execute(): Promise<TemplateAprovadoEntity[]> {
    return this.templateWhatsAppRepository.findAllAprovados();
  }
}

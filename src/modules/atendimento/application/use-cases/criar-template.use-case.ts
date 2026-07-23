import type { TemplateAprovadoEntity } from "@/modules/atendimento/domain/entities/template-whatsapp.entity";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";
import type { CriarTemplateInput } from "@/modules/atendimento/application/dto/criar-template.dto";

// Submete o template pra aprovação da Meta de verdade (Business
// Management API) e só então persiste local — nunca inventa uma
// aprovação; o status inicial é sempre o que a Meta devolver (PENDING,
// na prática, pra toda submissão nova).
export class CriarTemplateUseCase {
  constructor(
    private readonly whatsAppMessagingService: WhatsAppMessagingService,
    private readonly templateWhatsAppRepository: TemplateWhatsAppRepository,
  ) {}

  async execute(input: CriarTemplateInput): Promise<TemplateAprovadoEntity> {
    const { metaTemplateId } = await this.whatsAppMessagingService.criarTemplate({
      nome: input.nome,
      categoria: input.categoria,
      idioma: input.idioma,
      conteudo: input.conteudo,
    });

    return this.templateWhatsAppRepository.criarLocal({
      metaTemplateId,
      nome: input.nome,
      idioma: input.idioma,
      conteudo: input.conteudo,
      categoria: input.categoria,
    });
  }
}

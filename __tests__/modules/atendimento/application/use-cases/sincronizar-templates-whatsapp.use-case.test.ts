import { SincronizarTemplatesWhatsAppUseCase } from "@/modules/atendimento/application/use-cases/sincronizar-templates-whatsapp.use-case";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";
import type { WhatsAppMessagingService } from "@/modules/atendimento/domain/services/whatsapp-messaging-service";

function fakeWhatsAppMessagingService(
  overrides: Partial<WhatsAppMessagingService> = {},
): WhatsAppMessagingService {
  return {
    enviarTexto: jest.fn(),
    enviarTemplate: jest.fn(),
    enviarMidia: jest.fn(),
    listarTemplatesAprovados: jest.fn().mockResolvedValue([]),
    baixarMidia: jest.fn(),
    ...overrides,
  };
}

function fakeTemplateWhatsAppRepository(): TemplateWhatsAppRepository {
  return {
    findAllAprovados: jest.fn(),
    upsertPorMetaTemplateId: jest.fn(),
  };
}

describe("SincronizarTemplatesWhatsAppUseCase", () => {
  it("faz upsert de cada template retornado pela Meta e devolve a contagem", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      listarTemplatesAprovados: jest.fn().mockResolvedValue([
        { metaTemplateId: "tpl-1", nome: "boas_vindas", conteudo: "Olá!", idioma: "pt_BR" },
        {
          metaTemplateId: "tpl-2",
          nome: "cadastro_aprovado",
          conteudo: "Seu cadastro foi aprovado.",
          idioma: "pt_BR",
        },
      ]),
    });
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository();
    const useCase = new SincronizarTemplatesWhatsAppUseCase(
      whatsAppMessagingService,
      templateWhatsAppRepository,
    );

    const total = await useCase.execute();

    expect(total).toBe(2);
    expect(templateWhatsAppRepository.upsertPorMetaTemplateId).toHaveBeenCalledTimes(2);
    expect(templateWhatsAppRepository.upsertPorMetaTemplateId).toHaveBeenNthCalledWith(1, {
      metaTemplateId: "tpl-1",
      nome: "boas_vindas",
      idioma: "pt_BR",
      conteudo: "Olá!",
    });
    expect(templateWhatsAppRepository.upsertPorMetaTemplateId).toHaveBeenNthCalledWith(2, {
      metaTemplateId: "tpl-2",
      nome: "cadastro_aprovado",
      idioma: "pt_BR",
      conteudo: "Seu cadastro foi aprovado.",
    });
  });

  it("não faz upsert nenhum e devolve 0 quando a Meta não retorna templates", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService();
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository();
    const useCase = new SincronizarTemplatesWhatsAppUseCase(
      whatsAppMessagingService,
      templateWhatsAppRepository,
    );

    const total = await useCase.execute();

    expect(total).toBe(0);
    expect(templateWhatsAppRepository.upsertPorMetaTemplateId).not.toHaveBeenCalled();
  });
});

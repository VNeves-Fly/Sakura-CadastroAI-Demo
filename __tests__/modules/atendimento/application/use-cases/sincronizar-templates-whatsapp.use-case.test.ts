import { SincronizarTemplatesWhatsAppUseCase } from "@/modules/atendimento/application/use-cases/sincronizar-templates-whatsapp.use-case";
import { fakeTemplateWhatsAppRepository, fakeWhatsAppMessagingService } from "../../fixtures";

describe("SincronizarTemplatesWhatsAppUseCase", () => {
  it("faz upsert de cada template retornado pela Meta (qualquer status) e devolve a contagem", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      listarTodosTemplates: jest.fn().mockResolvedValue([
        {
          metaTemplateId: "tpl-1",
          nome: "boas_vindas",
          conteudo: "Olá!",
          idioma: "pt_BR",
          categoria: "UTILITY",
          status: "APPROVED",
          motivoRejeicao: null,
        },
        {
          metaTemplateId: "tpl-2",
          nome: "promocao",
          conteudo: "Aproveite!",
          idioma: "pt_BR",
          categoria: "MARKETING",
          status: "REJECTED",
          motivoRejeicao: "Texto genérico demais.",
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
      categoria: "UTILITY",
      status: "APPROVED",
      motivoRejeicao: null,
    });
    expect(templateWhatsAppRepository.upsertPorMetaTemplateId).toHaveBeenNthCalledWith(2, {
      metaTemplateId: "tpl-2",
      nome: "promocao",
      idioma: "pt_BR",
      conteudo: "Aproveite!",
      categoria: "MARKETING",
      status: "REJECTED",
      motivoRejeicao: "Texto genérico demais.",
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

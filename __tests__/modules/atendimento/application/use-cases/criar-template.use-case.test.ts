import { CriarTemplateUseCase } from "@/modules/atendimento/application/use-cases/criar-template.use-case";
import { fakeTemplateWhatsAppRepository, fakeWhatsAppMessagingService } from "../../fixtures";

describe("CriarTemplateUseCase", () => {
  it("submete o template pra Meta e só então persiste local com o metaTemplateId retornado", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      criarTemplate: jest.fn().mockResolvedValue({ metaTemplateId: "meta-tpl-99" }),
    });
    const criado = {
      id: "tpl-local-1",
      nome: "boas_vindas",
      conteudo: "Olá!",
      categoria: "UTILITY" as const,
      idioma: "pt_BR",
      status: "pendente_aprovacao" as const,
      motivoRejeicao: null,
      criadoEm: "2026-01-01T00:00:00.000Z",
    };
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      criarLocal: jest.fn().mockResolvedValue(criado),
    });
    const useCase = new CriarTemplateUseCase(whatsAppMessagingService, templateWhatsAppRepository);

    const resultado = await useCase.execute({
      nome: "boas_vindas",
      conteudo: "Olá!",
      categoria: "UTILITY",
      idioma: "pt_BR",
    });

    expect(whatsAppMessagingService.criarTemplate).toHaveBeenCalledWith({
      nome: "boas_vindas",
      categoria: "UTILITY",
      idioma: "pt_BR",
      conteudo: "Olá!",
    });
    expect(templateWhatsAppRepository.criarLocal).toHaveBeenCalledWith({
      metaTemplateId: "meta-tpl-99",
      nome: "boas_vindas",
      idioma: "pt_BR",
      conteudo: "Olá!",
      categoria: "UTILITY",
    });
    expect(resultado).toBe(criado);
  });

  it("não persiste local se a submissão pra Meta falhar", async () => {
    const whatsAppMessagingService = fakeWhatsAppMessagingService({
      criarTemplate: jest.fn().mockRejectedValue(new Error("Meta recusou")),
    });
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository();
    const useCase = new CriarTemplateUseCase(whatsAppMessagingService, templateWhatsAppRepository);

    await expect(
      useCase.execute({ nome: "x", conteudo: "y", categoria: "UTILITY", idioma: "pt_BR" }),
    ).rejects.toThrow("Meta recusou");
    expect(templateWhatsAppRepository.criarLocal).not.toHaveBeenCalled();
  });
});

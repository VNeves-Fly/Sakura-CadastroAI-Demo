import { ReenviarTemplateUseCase } from "@/modules/atendimento/application/use-cases/reenviar-template.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import { fakeTemplateWhatsAppRepository, fakeWhatsAppMessagingService } from "../../fixtures";

function templateComStatus(status: "aprovado" | "pendente_aprovacao" | "rejeitado") {
  return {
    id: "tpl-1",
    nome: "promocao",
    conteudo: "Texto antigo",
    categoria: "MARKETING" as const,
    idioma: "pt_BR",
    status,
    motivoRejeicao: status === "rejeitado" ? "Texto genérico demais." : null,
    criadoEm: "2026-01-01T00:00:00.000Z",
  };
}

describe("ReenviarTemplateUseCase", () => {
  it("lança NotFoundError se o template não existe", async () => {
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const whatsAppMessagingService = fakeWhatsAppMessagingService();
    const useCase = new ReenviarTemplateUseCase(
      templateWhatsAppRepository,
      whatsAppMessagingService,
    );

    await expect(useCase.execute("tpl-inexistente", "novo texto")).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se o template não está rejeitado", async () => {
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      findById: jest.fn().mockResolvedValue(templateComStatus("aprovado")),
    });
    const whatsAppMessagingService = fakeWhatsAppMessagingService();
    const useCase = new ReenviarTemplateUseCase(
      templateWhatsAppRepository,
      whatsAppMessagingService,
    );

    await expect(useCase.execute("tpl-1", "novo texto")).rejects.toThrow(ConflictError);
    expect(whatsAppMessagingService.editarTemplate).not.toHaveBeenCalled();
  });

  it("edita na Meta e atualiza local quando o template está rejeitado", async () => {
    const atualizado = templateComStatus("pendente_aprovacao");
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      findById: jest.fn().mockResolvedValue(templateComStatus("rejeitado")),
      obterMetaTemplateId: jest.fn().mockResolvedValue("meta-tpl-1"),
      atualizarAposReenvio: jest.fn().mockResolvedValue(atualizado),
    });
    const whatsAppMessagingService = fakeWhatsAppMessagingService();
    const useCase = new ReenviarTemplateUseCase(
      templateWhatsAppRepository,
      whatsAppMessagingService,
    );

    const resultado = await useCase.execute("tpl-1", "texto corrigido");

    expect(whatsAppMessagingService.editarTemplate).toHaveBeenCalledWith(
      "meta-tpl-1",
      "texto corrigido",
    );
    expect(templateWhatsAppRepository.atualizarAposReenvio).toHaveBeenCalledWith(
      "tpl-1",
      "texto corrigido",
    );
    expect(resultado).toBe(atualizado);
  });
});

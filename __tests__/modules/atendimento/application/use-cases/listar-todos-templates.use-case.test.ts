import { ListarTodosTemplatesUseCase } from "@/modules/atendimento/application/use-cases/listar-todos-templates.use-case";
import { fakeTemplateWhatsAppRepository } from "../../fixtures";

describe("ListarTodosTemplatesUseCase", () => {
  it("devolve o que findAll do repositório retorna, independente do status", async () => {
    const templates = [
      {
        id: "tpl-1",
        nome: "rejeitado",
        conteudo: "x",
        categoria: "MARKETING" as const,
        idioma: "pt_BR",
        status: "rejeitado" as const,
        motivoRejeicao: "motivo",
        criadoEm: "2026-01-01T00:00:00.000Z",
      },
    ];
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      findAll: jest.fn().mockResolvedValue(templates),
    });

    const resultado = await new ListarTodosTemplatesUseCase(templateWhatsAppRepository).execute();

    expect(resultado).toBe(templates);
    expect(templateWhatsAppRepository.findAllAprovados).not.toHaveBeenCalled();
  });
});

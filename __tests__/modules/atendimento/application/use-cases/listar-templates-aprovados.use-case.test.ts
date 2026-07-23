import { ListarTemplatesAprovadosUseCase } from "@/modules/atendimento/application/use-cases/listar-templates-aprovados.use-case";
import { fakeTemplateWhatsAppRepository } from "../../fixtures";

describe("ListarTemplatesAprovadosUseCase", () => {
  it("devolve o que o repositório de templates retorna", async () => {
    const templates = [
      {
        id: "tpl-1",
        nome: "boas_vindas",
        conteudo: "Olá!",
        categoria: "UTILITY" as const,
        idioma: "pt_BR",
        status: "aprovado" as const,
        motivoRejeicao: null,
        criadoEm: "2026-01-01T00:00:00.000Z",
      },
    ];
    const templateWhatsAppRepository = fakeTemplateWhatsAppRepository({
      findAllAprovados: jest.fn().mockResolvedValue(templates),
    });

    const resultado = await new ListarTemplatesAprovadosUseCase(
      templateWhatsAppRepository,
    ).execute();

    expect(resultado).toBe(templates);
  });
});

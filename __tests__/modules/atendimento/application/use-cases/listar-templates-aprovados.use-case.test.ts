import { ListarTemplatesAprovadosUseCase } from "@/modules/atendimento/application/use-cases/listar-templates-aprovados.use-case";
import type { TemplateWhatsAppRepository } from "@/modules/atendimento/domain/repositories/template-whatsapp-repository";

describe("ListarTemplatesAprovadosUseCase", () => {
  it("devolve o que o repositório de templates retorna", async () => {
    const templates = [{ id: "tpl-1", nome: "boas_vindas", conteudo: "Olá!", idioma: "pt_BR" }];
    const templateWhatsAppRepository: TemplateWhatsAppRepository = {
      findAllAprovados: jest.fn().mockResolvedValue(templates),
      upsertPorMetaTemplateId: jest.fn(),
    };

    const resultado = await new ListarTemplatesAprovadosUseCase(
      templateWhatsAppRepository,
    ).execute();

    expect(resultado).toBe(templates);
  });
});

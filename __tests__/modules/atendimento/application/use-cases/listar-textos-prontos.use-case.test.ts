import { ListarTextosProntosUseCase } from "@/modules/atendimento/application/use-cases/listar-textos-prontos.use-case";
import { fakeTextoProntoRepository } from "../../fixtures";

describe("ListarTextosProntosUseCase", () => {
  it("devolve o que o repositório de textos prontos retorna", async () => {
    const textos = [{ id: "txt-1", titulo: "Saudação", conteudo: "Olá, tudo bem?" }];
    const textoProntoRepository = fakeTextoProntoRepository({
      findAll: jest.fn().mockResolvedValue(textos),
    });

    const resultado = await new ListarTextosProntosUseCase(textoProntoRepository).execute();

    expect(resultado).toBe(textos);
  });
});

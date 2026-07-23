import { ListarTextosProntosUseCase } from "@/modules/atendimento/application/use-cases/listar-textos-prontos.use-case";
import type { TextoProntoRepository } from "@/modules/atendimento/domain/repositories/texto-pronto-repository";

describe("ListarTextosProntosUseCase", () => {
  it("devolve o que o repositório de textos prontos retorna", async () => {
    const textos = [{ id: "txt-1", titulo: "Saudação", conteudo: "Olá, tudo bem?" }];
    const textoProntoRepository: TextoProntoRepository = {
      findAll: jest.fn().mockResolvedValue(textos),
      create: jest.fn(),
    };

    const resultado = await new ListarTextosProntosUseCase(textoProntoRepository).execute();

    expect(resultado).toBe(textos);
  });
});

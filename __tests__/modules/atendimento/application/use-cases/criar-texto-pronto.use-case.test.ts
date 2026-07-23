import { CriarTextoProntoUseCase } from "@/modules/atendimento/application/use-cases/criar-texto-pronto.use-case";
import { fakeTextoProntoRepository } from "../../fixtures";

describe("CriarTextoProntoUseCase", () => {
  it("repassa o input pro repositório e devolve o texto criado", async () => {
    const criado = { id: "txt-novo", titulo: "Título", conteudo: "Conteúdo" };
    const textoProntoRepository = fakeTextoProntoRepository({
      create: jest.fn().mockResolvedValue(criado),
    });

    const resultado = await new CriarTextoProntoUseCase(textoProntoRepository).execute({
      titulo: "Título",
      conteudo: "Conteúdo",
      criadoPorId: "analista-1",
    });

    expect(textoProntoRepository.create).toHaveBeenCalledWith({
      titulo: "Título",
      conteudo: "Conteúdo",
      criadoPorId: "analista-1",
    });
    expect(resultado).toBe(criado);
  });
});

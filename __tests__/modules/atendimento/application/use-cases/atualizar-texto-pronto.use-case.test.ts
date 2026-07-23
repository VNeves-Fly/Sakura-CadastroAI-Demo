import { AtualizarTextoProntoUseCase } from "@/modules/atendimento/application/use-cases/atualizar-texto-pronto.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { fakeTextoProntoRepository } from "../../fixtures";

describe("AtualizarTextoProntoUseCase", () => {
  it("lança NotFoundError se o texto pronto não existe", async () => {
    const textoProntoRepository = fakeTextoProntoRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = new AtualizarTextoProntoUseCase(textoProntoRepository);

    await expect(
      useCase.execute("txt-inexistente", { titulo: "t", conteudo: "c" }),
    ).rejects.toThrow(NotFoundError);
    expect(textoProntoRepository.update).not.toHaveBeenCalled();
  });

  it("atualiza quando o texto pronto existe", async () => {
    const existente = { id: "txt-1", titulo: "Antigo", conteudo: "Velho" };
    const atualizado = { id: "txt-1", titulo: "Novo", conteudo: "Atualizado" };
    const textoProntoRepository = fakeTextoProntoRepository({
      findById: jest.fn().mockResolvedValue(existente),
      update: jest.fn().mockResolvedValue(atualizado),
    });
    const useCase = new AtualizarTextoProntoUseCase(textoProntoRepository);

    const resultado = await useCase.execute("txt-1", { titulo: "Novo", conteudo: "Atualizado" });

    expect(textoProntoRepository.update).toHaveBeenCalledWith("txt-1", {
      titulo: "Novo",
      conteudo: "Atualizado",
    });
    expect(resultado).toBe(atualizado);
  });
});

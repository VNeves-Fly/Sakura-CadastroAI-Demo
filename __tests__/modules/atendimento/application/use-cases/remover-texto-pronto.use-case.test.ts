import { RemoverTextoProntoUseCase } from "@/modules/atendimento/application/use-cases/remover-texto-pronto.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import { fakeTextoProntoRepository } from "../../fixtures";

describe("RemoverTextoProntoUseCase", () => {
  it("lança NotFoundError se o texto pronto não existe", async () => {
    const textoProntoRepository = fakeTextoProntoRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const useCase = new RemoverTextoProntoUseCase(textoProntoRepository);

    await expect(useCase.execute("txt-inexistente")).rejects.toThrow(NotFoundError);
    expect(textoProntoRepository.remover).not.toHaveBeenCalled();
  });

  it("remove quando o texto pronto existe", async () => {
    const textoProntoRepository = fakeTextoProntoRepository({
      findById: jest.fn().mockResolvedValue({ id: "txt-1", titulo: "t", conteudo: "c" }),
    });
    const useCase = new RemoverTextoProntoUseCase(textoProntoRepository);

    await useCase.execute("txt-1");

    expect(textoProntoRepository.remover).toHaveBeenCalledWith("txt-1");
  });
});

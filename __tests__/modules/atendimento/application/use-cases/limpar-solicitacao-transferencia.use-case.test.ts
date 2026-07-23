import { LimparSolicitacaoTransferenciaUseCase } from "@/modules/atendimento/application/use-cases/limpar-solicitacao-transferencia.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import {
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
} from "../../fixtures";

describe("LimparSolicitacaoTransferenciaUseCase", () => {
  it("limpa a solicitação e devolve a conversa atualizada", async () => {
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
    const conversaRepository = fakeConversaRepository();
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const useCase = new LimparSolicitacaoTransferenciaUseCase(
      solicitacaoTransferenciaRepository,
      conversaRepository,
      resumoFichaClienteRepository,
    );

    const conversa = await useCase.execute("conv-1");

    expect(solicitacaoTransferenciaRepository.limpar).toHaveBeenCalledWith("conv-1");
    expect(conversa.id).toBe("conv-1");
  });

  it("lança NotFoundError se a conversa não existe", async () => {
    const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
    const conversaRepository = fakeConversaRepository({
      findById: jest.fn().mockResolvedValue(null),
    });
    const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
    const useCase = new LimparSolicitacaoTransferenciaUseCase(
      solicitacaoTransferenciaRepository,
      conversaRepository,
      resumoFichaClienteRepository,
    );

    await expect(useCase.execute("conv-inexistente")).rejects.toThrow(NotFoundError);
  });
});

import { EncerrarAtendimentoUseCase } from "@/modules/atendimento/application/use-cases/encerrar-atendimento.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { RegistroAtendimentoAtual } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import {
  fakeAssumirAtendimentoRepository,
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
} from "../../fixtures";

function criarUseCase() {
  const assumirAtendimentoRepository = fakeAssumirAtendimentoRepository();
  const conversaRepository = fakeConversaRepository();
  const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
  const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();

  const useCase = new EncerrarAtendimentoUseCase(
    assumirAtendimentoRepository,
    conversaRepository,
    resumoFichaClienteRepository,
    solicitacaoTransferenciaRepository,
  );

  return { useCase, assumirAtendimentoRepository, conversaRepository };
}

describe("EncerrarAtendimentoUseCase", () => {
  it("lança ConflictError se ninguém está atendendo a conversa", async () => {
    const { useCase } = criarUseCase();

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" }),
    ).rejects.toThrow(ConflictError);
  });

  it("lança ConflictError se quem chama não é quem está atendendo", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    const atual: RegistroAtendimentoAtual = {
      id: "reg-1",
      analistaId: "outro-analista",
      assumidoEm: new Date(),
    };
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(atual);

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" }),
    ).rejects.toThrow(ConflictError);
    expect(assumirAtendimentoRepository.liberar).not.toHaveBeenCalled();
  });

  it("libera o atendimento quando quem chama é quem está atendendo", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    const atual: RegistroAtendimentoAtual = {
      id: "reg-1",
      analistaId: "analista-1",
      assumidoEm: new Date(),
    };
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(atual);

    const conversa = await useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" });

    expect(assumirAtendimentoRepository.liberar).toHaveBeenCalledWith("reg-1");
    expect(conversa.id).toBe("conv-1");
  });

  it("lança NotFoundError se a conversa sumir depois de liberar", async () => {
    const { useCase, assumirAtendimentoRepository, conversaRepository } = criarUseCase();
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue({
      id: "reg-1",
      analistaId: "analista-1",
      assumidoEm: new Date(),
    });
    (conversaRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" }),
    ).rejects.toThrow(NotFoundError);
  });
});

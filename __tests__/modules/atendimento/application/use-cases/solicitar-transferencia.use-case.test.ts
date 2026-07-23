import { SolicitarTransferenciaUseCase } from "@/modules/atendimento/application/use-cases/solicitar-transferencia.use-case";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";
import type { RegistroAtendimentoAtual } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import {
  fakeAssumirAtendimentoRepository,
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
  fakeUserRepository,
} from "../../fixtures";

const ATUAL_DO_ANALISTA: RegistroAtendimentoAtual = {
  id: "reg-1",
  analistaId: "analista-1",
  assumidoEm: new Date(),
};

function criarUseCase() {
  const assumirAtendimentoRepository = fakeAssumirAtendimentoRepository({
    findAtual: jest.fn().mockResolvedValue(ATUAL_DO_ANALISTA),
  });
  const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();
  const conversaRepository = fakeConversaRepository();
  const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
  const userRepository = fakeUserRepository();

  const useCase = new SolicitarTransferenciaUseCase(
    assumirAtendimentoRepository,
    solicitacaoTransferenciaRepository,
    conversaRepository,
    resumoFichaClienteRepository,
    userRepository,
  );

  return {
    useCase,
    assumirAtendimentoRepository,
    solicitacaoTransferenciaRepository,
    conversaRepository,
    userRepository,
  };
}

describe("SolicitarTransferenciaUseCase", () => {
  it("lança DomainError ao tentar transferir pra si mesmo", async () => {
    const { useCase } = criarUseCase();

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        deAnalistaId: "analista-1",
        paraAnalistaId: "analista-1",
      }),
    ).rejects.toThrow(DomainError);
  });

  it("lança ConflictError se ninguém está atendendo a conversa", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        deAnalistaId: "analista-1",
        paraAnalistaId: "user-2",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("lança ConflictError se quem pede não é quem está atendendo", async () => {
    const { useCase } = criarUseCase();

    await expect(
      useCase.execute({ conversaId: "conv-1", deAnalistaId: "outro-id", paraAnalistaId: "user-2" }),
    ).rejects.toThrow(ConflictError);
  });

  it("lança NotFoundError se o analista de destino não existe", async () => {
    const { useCase, userRepository } = criarUseCase();
    (userRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        deAnalistaId: "analista-1",
        paraAnalistaId: "inexistente",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se já existe uma solicitação pendente", async () => {
    const { useCase, solicitacaoTransferenciaRepository } = criarUseCase();
    (solicitacaoTransferenciaRepository.findPendentePorConversa as jest.Mock).mockResolvedValue({
      id: "transf-existente",
      paraAnalistaId: "user-3",
      criadaEm: new Date(),
    });

    await expect(
      useCase.execute({
        conversaId: "conv-1",
        deAnalistaId: "analista-1",
        paraAnalistaId: "user-2",
      }),
    ).rejects.toThrow(ConflictError);
    expect(solicitacaoTransferenciaRepository.criar).not.toHaveBeenCalled();
  });

  it("cria a solicitação quando tudo está certo", async () => {
    const { useCase, solicitacaoTransferenciaRepository, conversaRepository } = criarUseCase();

    const conversa = await useCase.execute({
      conversaId: "conv-1",
      deAnalistaId: "analista-1",
      paraAnalistaId: "user-2",
    });

    expect(solicitacaoTransferenciaRepository.criar).toHaveBeenCalledWith({
      conversaId: "conv-1",
      deAnalistaId: "analista-1",
      paraAnalistaId: "user-2",
    });
    expect(conversaRepository.findById).toHaveBeenCalledWith("conv-1");
    expect(conversa.id).toBe("conv-1");
  });
});

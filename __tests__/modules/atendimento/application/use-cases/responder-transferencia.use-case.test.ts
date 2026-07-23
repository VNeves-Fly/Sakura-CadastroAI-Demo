import { ResponderTransferenciaUseCase } from "@/modules/atendimento/application/use-cases/responder-transferencia.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { RegistroAtendimentoAtual } from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import {
  fakeAssumirAtendimentoRepository,
  fakeConversaRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
} from "../../fixtures";

const PENDENTE = { id: "transf-1", paraAnalistaId: "analista-alvo", criadaEm: new Date() };

function criarUseCase() {
  const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository({
    findPendentePorConversa: jest.fn().mockResolvedValue(PENDENTE),
  });
  const assumirAtendimentoRepository = fakeAssumirAtendimentoRepository();
  const conversaRepository = fakeConversaRepository();
  const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();

  const useCase = new ResponderTransferenciaUseCase(
    solicitacaoTransferenciaRepository,
    assumirAtendimentoRepository,
    conversaRepository,
    resumoFichaClienteRepository,
  );

  return {
    useCase,
    solicitacaoTransferenciaRepository,
    assumirAtendimentoRepository,
    conversaRepository,
  };
}

describe("ResponderTransferenciaUseCase", () => {
  it("lança NotFoundError se não há solicitação pendente", async () => {
    const { useCase, solicitacaoTransferenciaRepository } = criarUseCase();
    (solicitacaoTransferenciaRepository.findPendentePorConversa as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-alvo", aceita: true }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se quem responde não é o destinatário", async () => {
    const { useCase } = criarUseCase();

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "outro-analista", aceita: true }),
    ).rejects.toThrow(ConflictError);
  });

  it("ao aceitar, marca aceita, libera o atendimento atual e cria um novo pro destinatário", async () => {
    const { useCase, solicitacaoTransferenciaRepository, assumirAtendimentoRepository } =
      criarUseCase();
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue({
      id: "reg-antigo",
      analistaId: "analista-1",
      assumidoEm: new Date(),
    } as RegistroAtendimentoAtual);

    await useCase.execute({ conversaId: "conv-1", analistaId: "analista-alvo", aceita: true });

    expect(solicitacaoTransferenciaRepository.aceitar).toHaveBeenCalledWith("transf-1");
    expect(assumirAtendimentoRepository.liberar).toHaveBeenCalledWith("reg-antigo");
    expect(assumirAtendimentoRepository.criar).toHaveBeenCalledWith("conv-1", "analista-alvo");
    expect(solicitacaoTransferenciaRepository.recusar).not.toHaveBeenCalled();
  });

  it("ao aceitar sem ninguém atendendo atualmente, só cria o novo registro (sem liberar)", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(null);

    await useCase.execute({ conversaId: "conv-1", analistaId: "analista-alvo", aceita: true });

    expect(assumirAtendimentoRepository.liberar).not.toHaveBeenCalled();
    expect(assumirAtendimentoRepository.criar).toHaveBeenCalledWith("conv-1", "analista-alvo");
  });

  it("ao recusar, só marca recusada — não mexe no atendimento atual", async () => {
    const { useCase, solicitacaoTransferenciaRepository, assumirAtendimentoRepository } =
      criarUseCase();

    await useCase.execute({ conversaId: "conv-1", analistaId: "analista-alvo", aceita: false });

    expect(solicitacaoTransferenciaRepository.recusar).toHaveBeenCalledWith("transf-1");
    expect(solicitacaoTransferenciaRepository.aceitar).not.toHaveBeenCalled();
    expect(assumirAtendimentoRepository.liberar).not.toHaveBeenCalled();
    expect(assumirAtendimentoRepository.criar).not.toHaveBeenCalled();
  });

  it("lança NotFoundError se a conversa sumir no final", async () => {
    const { useCase, conversaRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-alvo", aceita: false }),
    ).rejects.toThrow(NotFoundError);
  });
});

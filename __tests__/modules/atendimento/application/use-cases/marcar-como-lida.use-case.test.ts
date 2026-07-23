import { MarcarComoLidaUseCase } from "@/modules/atendimento/application/use-cases/marcar-como-lida.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import {
  fakeConversa,
  fakeConversaRepository,
  fakeMensagemRepository,
  fakeResumoFichaClienteRepository,
  fakeSolicitacaoTransferenciaRepository,
} from "../../fixtures";

function criarUseCase() {
  const conversaRepository = fakeConversaRepository();
  const mensagemRepository = fakeMensagemRepository();
  const resumoFichaClienteRepository = fakeResumoFichaClienteRepository();
  const solicitacaoTransferenciaRepository = fakeSolicitacaoTransferenciaRepository();

  const useCase = new MarcarComoLidaUseCase(
    conversaRepository,
    mensagemRepository,
    resumoFichaClienteRepository,
    solicitacaoTransferenciaRepository,
  );
  return { useCase, conversaRepository, mensagemRepository, resumoFichaClienteRepository };
}

describe("MarcarComoLidaUseCase", () => {
  it("marca as mensagens do cliente como lidas e devolve a conversa atualizada", async () => {
    const { useCase, mensagemRepository } = criarUseCase();

    const conversa = await useCase.execute("conv-1");

    expect(mensagemRepository.marcarClienteComoLidas).toHaveBeenCalledWith("conv-1");
    expect(conversa.resumoFicha.statusAgencia).toBe("ativo");
  });

  it("lança NotFoundError se a conversa não existe", async () => {
    const { useCase, conversaRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute("conv-inexistente")).rejects.toThrow(NotFoundError);
  });

  it("não chama o repositório de ficha pra conversa não identificada", async () => {
    const { useCase, conversaRepository, resumoFichaClienteRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(
      fakeConversa({ agenciaId: null, tipoContato: "nao_identificado" }),
    );

    const conversa = await useCase.execute("conv-1");

    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
    expect(conversa.resumoFicha.statusAgencia).toBe("em_andamento");
  });
});

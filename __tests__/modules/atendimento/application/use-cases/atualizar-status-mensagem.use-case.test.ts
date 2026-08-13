import { AtualizarStatusMensagemUseCase } from "@/modules/atendimento/application/use-cases/atualizar-status-mensagem.use-case";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";

function criarMensagemRepositoryFake(): MensagemRepository {
  return {
    create: jest.fn(),
    criarMidia: jest.fn(),
    findMidiaById: jest.fn(),
    marcarClienteComoLidas: jest.fn(),
    contarNaoLidas: jest.fn(),
    findByWaMessageId: jest.fn(),
    atualizarStatusPorWaMessageId: jest.fn(),
  };
}

describe("AtualizarStatusMensagemUseCase", () => {
  it("repassa waMessageId e status pro repositório", async () => {
    const mensagemRepository = criarMensagemRepositoryFake();
    const useCase = new AtualizarStatusMensagemUseCase(mensagemRepository);

    await useCase.execute({ waMessageId: "wamid.1", status: "delivered" });

    expect(mensagemRepository.atualizarStatusPorWaMessageId).toHaveBeenCalledWith(
      "wamid.1",
      "delivered",
    );
  });
});

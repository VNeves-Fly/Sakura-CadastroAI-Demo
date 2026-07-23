import { MarcarComoLidaUseCase } from "@/modules/atendimento/application/use-cases/marcar-como-lida.use-case";
import { NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
import type { MensagemRepository } from "@/modules/atendimento/domain/repositories/mensagem-repository";
import type { ResumoFichaClienteRepository } from "@/modules/atendimento/domain/repositories/resumo-ficha-cliente-repository";

function fakeConversa(overrides: Partial<ConversaEntity> = {}): ConversaEntity {
  return {
    id: "conv-1",
    tipoContato: "agencia",
    agenciaId: "ag-1",
    agenciaNome: "Agência X",
    agenciaCnpj: "11222333000181",
    membro: { id: "conv-1", nome: "Fulano", papel: "socio", telefone: "5511999999999" },
    mensagens: [],
    atendimentoAtual: null,
    historicoAtendimento: [],
    resumoFicha: {
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastMessageAt: null,
    ...overrides,
  };
}

function criarUseCase() {
  const conversaRepository: ConversaRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(fakeConversa()),
    findByTelefoneWhatsapp: jest.fn(),
    create: jest.fn(),
    touchLastMessage: jest.fn(),
  };
  const mensagemRepository: MensagemRepository = {
    create: jest.fn(),
    criarMidia: jest.fn(),
    findMidiaById: jest.fn(),
    marcarClienteComoLidas: jest.fn(),
    findByWaMessageId: jest.fn(),
    atualizarStatusPorWaMessageId: jest.fn(),
  };
  const resumoFichaClienteRepository: ResumoFichaClienteRepository = {
    obterResumo: jest.fn().mockResolvedValue({
      statusAgencia: "ativo",
      documentosAprovados: 1,
      documentosPendentes: 0,
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    }),
  };

  const useCase = new MarcarComoLidaUseCase(
    conversaRepository,
    mensagemRepository,
    resumoFichaClienteRepository,
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

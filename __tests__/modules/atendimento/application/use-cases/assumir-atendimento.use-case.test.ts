import { AssumirAtendimentoUseCase } from "@/modules/atendimento/application/use-cases/assumir-atendimento.use-case";
import { ConflictError, NotFoundError } from "@/modules/shared/domain/errors";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
import type {
  AssumirAtendimentoRepository,
  RegistroAtendimentoAtual,
} from "@/modules/atendimento/domain/repositories/assumir-atendimento-repository";
import type { ConversaRepository } from "@/modules/atendimento/domain/repositories/conversa-repository";
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
  const assumirAtendimentoRepository: AssumirAtendimentoRepository = {
    findAtual: jest.fn().mockResolvedValue(null),
    criar: jest.fn().mockResolvedValue({
      analistaNome: "Ana Analista",
      assumidoEm: "2026-01-02T00:00:00.000Z",
      liberadoEm: null,
    }),
    liberar: jest.fn(),
  };

  const conversaRepository: ConversaRepository = {
    findAll: jest.fn(),
    findById: jest.fn().mockResolvedValue(fakeConversa()),
    findByTelefoneWhatsapp: jest.fn(),
    create: jest.fn(),
    touchLastMessage: jest.fn(),
  };

  const resumoFichaClienteRepository: ResumoFichaClienteRepository = {
    obterResumo: jest.fn().mockResolvedValue({
      statusAgencia: "ativo",
      documentosAprovados: 3,
      documentosPendentes: 0,
      situacaoCadastralReceita: "ATIVA",
      contratoStatus: "assinado",
      amatSofiaConsultado: true,
    }),
  };

  const useCase = new AssumirAtendimentoUseCase(
    assumirAtendimentoRepository,
    conversaRepository,
    resumoFichaClienteRepository,
  );

  return {
    useCase,
    assumirAtendimentoRepository,
    conversaRepository,
    resumoFichaClienteRepository,
  };
}

describe("AssumirAtendimentoUseCase", () => {
  it("assume direto quando ninguém está atendendo (sem liberar nada antes)", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();

    const conversa = await useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" });

    expect(assumirAtendimentoRepository.liberar).not.toHaveBeenCalled();
    expect(assumirAtendimentoRepository.criar).toHaveBeenCalledWith("conv-1", "analista-1");
    expect(conversa.resumoFicha.statusAgencia).toBe("ativo");
  });

  it("lança ConflictError se outro analista assumiu há menos de 2h", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    const atual: RegistroAtendimentoAtual = {
      id: "reg-1",
      analistaId: "outro-analista",
      assumidoEm: new Date(Date.now() - 30 * 60 * 1000), // 30 min atrás
    };
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(atual);

    await expect(
      useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" }),
    ).rejects.toThrow(ConflictError);

    expect(assumirAtendimentoRepository.liberar).not.toHaveBeenCalled();
    expect(assumirAtendimentoRepository.criar).not.toHaveBeenCalled();
  });

  it("permite assumir de novo quando já é o mesmo analista, mesmo dentro das 2h", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    const atual: RegistroAtendimentoAtual = {
      id: "reg-1",
      analistaId: "analista-1",
      assumidoEm: new Date(Date.now() - 30 * 60 * 1000),
    };
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(atual);

    await useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" });

    expect(assumirAtendimentoRepository.liberar).toHaveBeenCalledWith("reg-1");
    expect(assumirAtendimentoRepository.criar).toHaveBeenCalledWith("conv-1", "analista-1");
  });

  it("permite outro analista assumir depois de passadas as 2h", async () => {
    const { useCase, assumirAtendimentoRepository } = criarUseCase();
    const atual: RegistroAtendimentoAtual = {
      id: "reg-1",
      analistaId: "outro-analista",
      assumidoEm: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h atrás
    };
    (assumirAtendimentoRepository.findAtual as jest.Mock).mockResolvedValue(atual);

    await useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" });

    expect(assumirAtendimentoRepository.liberar).toHaveBeenCalledWith("reg-1");
    expect(assumirAtendimentoRepository.criar).toHaveBeenCalledWith("conv-1", "analista-1");
  });

  it("lança NotFoundError se a conversa sumir entre criar o registro e buscar de novo", async () => {
    const { useCase, conversaRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({ conversaId: "conv-inexistente", analistaId: "analista-1" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("usa o placeholder de resumo pra conversa não identificada, sem chamar o repositório de ficha", async () => {
    const { useCase, conversaRepository, resumoFichaClienteRepository } = criarUseCase();
    (conversaRepository.findById as jest.Mock).mockResolvedValue(
      fakeConversa({ agenciaId: null, tipoContato: "nao_identificado" }),
    );

    const conversa = await useCase.execute({ conversaId: "conv-1", analistaId: "analista-1" });

    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
    expect(conversa.resumoFicha).toEqual({
      statusAgencia: "em_andamento",
      documentosAprovados: 0,
      documentosPendentes: 0,
      situacaoCadastralReceita: null,
      contratoStatus: null,
      amatSofiaConsultado: false,
    });
  });
});

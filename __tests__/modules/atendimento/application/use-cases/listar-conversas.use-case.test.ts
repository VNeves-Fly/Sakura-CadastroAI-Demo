import { ListarConversasUseCase } from "@/modules/atendimento/application/use-cases/listar-conversas.use-case";
import type { ConversaEntity } from "@/modules/atendimento/domain/entities/conversa.entity";
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

describe("ListarConversasUseCase", () => {
  it("sobrescreve o resumoFicha com o real da agência quando agenciaId existe", async () => {
    const conversaRepository: ConversaRepository = {
      findAll: jest.fn().mockResolvedValue([fakeConversa({ agenciaId: "ag-1" })]),
      findById: jest.fn(),
      findByTelefoneWhatsapp: jest.fn(),
      create: jest.fn(),
      touchLastMessage: jest.fn(),
    };
    const resumoFichaClienteRepository: ResumoFichaClienteRepository = {
      obterResumo: jest.fn().mockResolvedValue({
        statusAgencia: "ativo",
        documentosAprovados: 5,
        documentosPendentes: 1,
        situacaoCadastralReceita: "ATIVA",
        contratoStatus: "assinado",
        amatSofiaConsultado: true,
      }),
    };
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();
    const conversa = resultado[0]!;

    expect(resumoFichaClienteRepository.obterResumo).toHaveBeenCalledWith("ag-1");
    expect(conversa.resumoFicha.statusAgencia).toBe("ativo");
    expect(conversa.resumoFicha.documentosAprovados).toBe(5);
  });

  it("usa o placeholder pra conversas não identificadas, sem chamar o repositório de ficha", async () => {
    const conversaRepository: ConversaRepository = {
      findAll: jest
        .fn()
        .mockResolvedValue([fakeConversa({ agenciaId: null, tipoContato: "nao_identificado" })]),
      findById: jest.fn(),
      findByTelefoneWhatsapp: jest.fn(),
      create: jest.fn(),
      touchLastMessage: jest.fn(),
    };
    const resumoFichaClienteRepository: ResumoFichaClienteRepository = {
      obterResumo: jest.fn(),
    };
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();
    const conversa = resultado[0]!;

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

  it("devolve lista vazia sem chamar o repositório de ficha", async () => {
    const conversaRepository: ConversaRepository = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      findByTelefoneWhatsapp: jest.fn(),
      create: jest.fn(),
      touchLastMessage: jest.fn(),
    };
    const resumoFichaClienteRepository: ResumoFichaClienteRepository = { obterResumo: jest.fn() };
    const useCase = new ListarConversasUseCase(conversaRepository, resumoFichaClienteRepository);

    const resultado = await useCase.execute();

    expect(resultado).toEqual([]);
    expect(resumoFichaClienteRepository.obterResumo).not.toHaveBeenCalled();
  });
});

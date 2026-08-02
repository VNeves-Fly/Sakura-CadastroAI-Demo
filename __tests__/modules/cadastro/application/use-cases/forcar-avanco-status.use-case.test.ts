import { ForcarAvancoStatusUseCase } from "@/modules/cadastro/application/use-cases/forcar-avanco-status.use-case";
import {
  STATUS_AGUARDANDO_ASSINATURA,
  STATUS_AGUARDANDO_CADASTRAMENTO,
  STATUS_AGUARDANDO_VALIDACAO,
  STATUS_ATIVO,
  type AgenciaRepository,
} from "@/modules/cadastro/domain/repositories/agencia-repository";
import type { HistoricoEdicaoCadastroRepository } from "@/modules/cadastro/domain/repositories/historico-edicao-cadastro-repository";
import { ConflictError, DomainError, NotFoundError } from "@/modules/shared/domain/errors";

function fakeAgenciaRepository(overrides: Partial<AgenciaRepository> = {}): AgenciaRepository {
  return {
    findByCnpj: jest.fn(),
    findById: jest.fn(),
    findByContratoProvedorId: jest.fn(),
    obterDetalhe: jest.fn(),
    create: jest.fn(),
    atualizarStatus: jest.fn().mockResolvedValue({ id: "ag-1" }),
    criarContrato: jest.fn(),
    atualizarStatusContrato: jest.fn(),
    listar: jest.fn(),
    obterKpis: jest.fn(),
    obterAnaliseContratos: jest.fn(),
    ...overrides,
  } as unknown as AgenciaRepository;
}

function fakeHistoricoEdicaoCadastroRepository(): HistoricoEdicaoCadastroRepository {
  return {
    create: jest.fn(),
    findByEntidadeId: jest.fn(),
  };
}

describe("ForcarAvancoStatusUseCase", () => {
  it("lança NotFoundError se a agência não existe", async () => {
    const useCase = new ForcarAvancoStatusUseCase(
      fakeAgenciaRepository({ obterDetalhe: jest.fn().mockResolvedValue(null) }),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "motivo", forcadoPor: "a@b.com" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("lança ConflictError se o status atual não tem avanço forçável", async () => {
    const useCase = new ForcarAvancoStatusUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest.fn().mockResolvedValue({ agencia: { status: STATUS_ATIVO } }),
      }),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "motivo", forcadoPor: "a@b.com" }),
    ).rejects.toThrow(ConflictError);
  });

  it("lança DomainError se a justificativa estiver vazia", async () => {
    const useCase = new ForcarAvancoStatusUseCase(
      fakeAgenciaRepository({
        obterDetalhe: jest
          .fn()
          .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_VALIDACAO } }),
      }),
      fakeHistoricoEdicaoCadastroRepository(),
    );

    await expect(
      useCase.execute({ agenciaId: "ag-1", justificativa: "   ", forcadoPor: "a@b.com" }),
    ).rejects.toThrow(DomainError);
  });

  it("avança aguardando_assinatura para aguardando_validacao e grava o histórico", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest
        .fn()
        .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_ASSINATURA } }),
    });
    const historicoEdicaoCadastroRepository = fakeHistoricoEdicaoCadastroRepository();
    const useCase = new ForcarAvancoStatusUseCase(
      agenciaRepository,
      historicoEdicaoCadastroRepository,
    );

    await useCase.execute({
      agenciaId: "ag-1",
      justificativa: "  webhook não chegou, confirmado com o sócio  ",
      forcadoPor: "analista@sakuratur.com.br",
    });

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "ag-1",
      STATUS_AGUARDANDO_VALIDACAO,
    );
    expect(historicoEdicaoCadastroRepository.create).toHaveBeenCalledWith({
      agenciaId: "ag-1",
      entidade: "Agencia",
      entidadeId: "ag-1",
      alteracoes: {
        status: { de: STATUS_AGUARDANDO_ASSINATURA, para: STATUS_AGUARDANDO_VALIDACAO },
      },
      justificativa: "webhook não chegou, confirmado com o sócio",
      editadoPor: "analista@sakuratur.com.br",
    });
  });

  it("avança aguardando_validacao para aguardando_cadastramento e grava o histórico", async () => {
    const agenciaRepository = fakeAgenciaRepository({
      obterDetalhe: jest
        .fn()
        .mockResolvedValue({ agencia: { status: STATUS_AGUARDANDO_VALIDACAO } }),
    });
    const historicoEdicaoCadastroRepository = fakeHistoricoEdicaoCadastroRepository();
    const useCase = new ForcarAvancoStatusUseCase(
      agenciaRepository,
      historicoEdicaoCadastroRepository,
    );

    await useCase.execute({
      agenciaId: "ag-1",
      justificativa: "D4Sign fora do ar, aprovador confirmou por telefone",
      forcadoPor: "analista@sakuratur.com.br",
    });

    expect(agenciaRepository.atualizarStatus).toHaveBeenCalledWith(
      "ag-1",
      STATUS_AGUARDANDO_CADASTRAMENTO,
    );
    expect(historicoEdicaoCadastroRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        alteracoes: {
          status: { de: STATUS_AGUARDANDO_VALIDACAO, para: STATUS_AGUARDANDO_CADASTRAMENTO },
        },
      }),
    );
  });
});
